import { Buffer } from "buffer";
import { createClient } from "@supabase/supabase-js";
import { assembleUserContext, saveGeminiPayload } from "../utils/contextAssembly";

// Initialize Supabase client globally - handle both server and client environments
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(request: Request): Promise<Response> {
  // Define CORS headers
  const origin = request.headers.get("origin") || "*";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      (request.headers.get("access-control-request-headers") as string) ||
      "Content-Type, Authorization, x-goog-api-key, ngrok-skip-browser-warning, User-Agent",
  } as Record<string, string>;

  try {
    const {
      medicationName,
      userId: requestUserId,
      pregnancyWeek = 0,
      currentMedications = [],
      labReports = [],
      language = "en",
    } = await request.json();

    console.log("Received medication safety request:", {
      medicationName,
      requestUserId,
      pregnancyWeek,
      medicationsCount: currentMedications?.length || 0,
      labReportsCount: labReports?.length || 0,
      language,
    });

    // Extract userId from request body or JWT token
    let userId: string | null = requestUserId || null;
    const authHeader = request.headers.get("authorization");

    if (!userId && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString(),
        );
        userId = payload?.sub || null;
        console.log("Extracted userId from JWT token for medication:", userId);
      } catch (e) {
        console.warn("Failed to decode JWT token for medication:", e);
      }
    }

    // If userId still missing, attempt to fetch from Supabase user (like symptom route)
    if (!userId && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
          console.log("Extracted userId from Supabase getUser for medication:", userId);
        }
      } catch (e) {
        console.warn("Supabase getUser failed for medication:", e);
      }
    }

    // Validate user_id format (UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      console.error("Invalid or missing user ID for medication safety");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers },
      );
    }
    console.log("✅ Using userId for medication safety:", userId);

    // Extract access token from Authorization header
    const authorizationHeader = request.headers.get("authorization");
    const accessToken = authorizationHeader?.startsWith("Bearer ") 
      ? authorizationHeader.substring(7) 
      : undefined;

    // Assemble fresh user context from database - ALWAYS use database as source of truth
    console.log("🔍 Assembling fresh user context from database for userId:", userId);
    const userContext = await assembleUserContext(userId, accessToken);

    console.log("📊 Assembled user context for medication:", {
      hasContext: !!userContext,
      pregnancyWeek: userContext?.pregnancyWeek,
      medicationCount: userContext?.currentMedications?.length || 0,
      labReportCount: userContext?.recentLabReports?.length || 0,
      medications: userContext?.currentMedications?.map((m: any) => ({ name: m.name, dosage: m.dosage })),
      labReports: userContext?.recentLabReports?.slice(0, 2).map((r: any) => ({ date: r.date, summary: r.summary }))
    });

    // Use ONLY server-assembled context from database
    const finalPregnancyWeek = userContext?.pregnancyWeek || 0;
    const finalMedications = userContext?.currentMedications || [];
    const finalLabReports = userContext?.recentLabReports || [];


    // Extract Authorization header
    const authorization = request.headers.get("Authorization") || "";

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("GEMINI_API_KEY is present:", !!apiKey);

    // Validate API key
    if (!apiKey) {
      console.error("Gemini API key not found in environment variables");
      return new Response(
        JSON.stringify({
          error: "API configuration error: Missing Gemini API key",
        }),
        {
          status: 500,
          headers,
        },
      );
    }

    // Validate required fields
    if (!medicationName || pregnancyWeek === undefined) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: medicationName and pregnancyWeek are required",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    console.log(
      "Analyzing medication safety for:",
      medicationName,
      "at week",
      pregnancyWeek,
      "in language:",
      language,
    );

    // Authentication and user context extraction
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers },
      );
    }

    // The code below this block was redundant as userId is now extracted earlier and validated.
    // It is kept here to avoid breaking the structure but could be refactored if desired.
    let extractedUserIdFromToken = null;
    const authHeaderForSession = request.headers.get("Authorization");
    if (authHeaderForSession && authHeaderForSession.startsWith("Bearer ")) {
      const token = authHeaderForSession.substring(7);
      try {
        // Validate session before proceeding
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Try to get user from token as fallback
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(token);
          if (user && !error) {
            extractedUserIdFromToken = user.id;
          }
        } else {
          extractedUserIdFromToken = session.user.id;
        }
      } catch (error) {
        console.log("Error extracting user from token:", error);
      }
    }

    // Validate user_id format (UUID format) - This is now handled by the initial userId check
    const uuidRegexForSession =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!extractedUserIdFromToken || !uuidRegexForSession.test(extractedUserIdFromToken)) {
      console.error("Invalid or missing user ID after authentication attempt.");
      // This response is unlikely to be hit due to earlier userId validation
      return new Response(
        JSON.stringify({ error: "Invalid authentication token or user ID" }),
        { status: 401, headers },
      );
    }
    console.log("Extracted user ID from token for medication safety (redundant check):", extractedUserIdFromToken);


    // Prepare enhanced lab reports context with last 3 reports
    const labReportsContext =
      userContext?.recentLabReports && userContext.recentLabReports.length > 0
        ? `Recent lab reports (last 3):\n${userContext.recentLabReports
            .map(
              (report: any, idx: number) =>
                `${idx + 1}. ${report.date}: ${report.summary}${
                  report.lab_results
                    ? `\n   Key results: ${report.lab_results
                        .slice(0, 3)
                        .map(
                          (r: any) =>
                            `${r.test_name}: ${r.value} ${r.unit}${r.is_abnormal ? " (abnormal)" : ""}`,
                        )
                        .join(", ")}`
                    : ""
                }`,
            )
            .join("\n")}`
        : finalLabReports && finalLabReports.length > 0
          ? `Recent lab results:\n${finalLabReports
              .slice(0, 10)
              .map(
                (r: any) =>
                  `- ${r.test_name}: ${r.value} ${r.unit} (${r.date})${r.is_abnormal ? " - abnormal" : ""}`,
              )
              .join("\n")}`
          : "No recent lab reports available.";

    // Create language-specific prompts
    const prompts = {
      ar: {
        systemPrompt: `أنت طبيب متخصص في أمان الأدوية أثناء الحمل. حلل أمان "${medicationName}" للحامل في الأسبوع ${finalPregnancyWeek}.

${labReportsContext}

قدم تحليل مختصر يشمل:
1. تقييم الأمان وتصنيف FDA
2. الفوائد الطبية الرئيسية
3. المخاطر المحتملة على الأم والجنين
4. التوصية النهائية

أرجع JSON باللغة العربية مع استخدام رموز FDA الإنجليزية فقط:
{
  "safetyAnalysis": "تقييم الأمان وتصنيف FDA في جملتين مختصرتين",
  "benefits": "الفوائد الطبية الرئيسية في جملتين",
  "risks": "المخاطر على الأم والجنين في جملتين",
  "fdaCategory": "A or B or C or D or X (English letters only)",
  "overallSafety": "التوصية النهائية في جملة واحدة"
}`,
      },
      en: {
        systemPrompt: `You are a medical specialist in pregnancy medication safety. Analyze "${medicationName}" for a pregnant woman at ${finalPregnancyWeek} weeks.

${labReportsContext}

Provide concise analysis:
1. Safety assessment and FDA category
2. Main medical benefits
3. Potential risks to mother and fetus
4. Final recommendation

Return ONLY valid JSON in English:
{
  "safetyAnalysis": "Safety assessment and FDA category in two concise sentences",
  "benefits": "Main medical benefits in two sentences",
  "risks": "Key risks to mother and fetus in two sentences",
  "fdaCategory": "A, B, C, D, or X",
  "overallSafety": "Final recommendation in one sentence"
}`,
      },
    };

    const currentPrompt =
      prompts[language as keyof typeof prompts] || prompts.en;

    // Construct final Gemini payload with complete context
    const finalGeminiPayload = {
      medicationName,
      pregnancyWeek: finalPregnancyWeek,
      labReports: finalLabReports,
      language,
      ...userContext, // Spread user context (includes profile, userContext, userId, etc.)
      // Standardized field names for verification
      medications: finalMedications,
      labResults: finalLabReports,
      timestamp: new Date().toISOString(),
    };

    // Save the final payload for testing (without secrets)
    saveGeminiPayload(finalGeminiPayload, "medication");

    // Call Gemini API with retry mechanism and increased timeouts
    let geminiResponse;
    let lastError;
    const maxRetries = 3;
    const requestTimeout = 120000; // 2 minutes timeout

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Gemini API attempt ${attempt}/${maxRetries} for medication analysis`,
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: currentPrompt.systemPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2, // Lower temperature for more consistent output
                topK: 32,
                topP: 0.9,
                maxOutputTokens: 8192, // Significantly increased
                responseMimeType: "application/json",
                responseSchema: {
                  type: "object",
                  properties: {
                    safetyAnalysis: { type: "string" },
                    benefits: { type: "string" },
                    risks: { type: "string" },
                    fdaCategory: { type: "string" },
                    overallSafety: { type: "string" },
                  },
                  required: [
                    "safetyAnalysis",
                    "benefits",
                    "risks",
                    "fdaCategory",
                    "overallSafety",
                  ],
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: "You are a medical AI specialized in pregnancy medication safety. Always return complete, valid JSON with all required fields. Keep responses detailed but structured. Ensure JSON is properly formatted and closed.",
                  },
                ],
              },
            }),
          },
        );

        clearTimeout(timeoutId);
        console.log(
          `Medication API attempt ${attempt} response status:`,
          geminiResponse.status,
        );

        // If successful or non-retryable error, break the loop
        if (
          geminiResponse.ok ||
          (geminiResponse.status !== 503 &&
            geminiResponse.status !== 429 &&
            geminiResponse.status !== 500)
        ) {
          break;
        }

        // Store error for potential retry
        const errorText = await geminiResponse.text();
        lastError = { status: geminiResponse.status, errorText };
        console.log(
          `Medication API attempt ${attempt} failed with status ${geminiResponse.status}, retrying...`,
        );

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const waitTime = Math.min(Math.pow(2, attempt) * 2000, 15000); // Max 15s wait
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } catch (fetchError: unknown) {
        console.error(
          `Medication API attempt ${attempt} failed with fetch error:`,
          fetchError,
        );
        lastError = {
          status: 500,
          errorText: `Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        };

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // Handle API errors after retry attempts
    if (!geminiResponse || !geminiResponse.ok) {
      const errorText = lastError?.errorText || "Unknown API error";
      const statusCode = lastError?.status || 500;

      console.error("Medication API error after retries:", {
        status: statusCode,
        errorText,
      });

      if (statusCode === 400) {
        throw new Error(
          "Invalid request. Please check the medication name and try again.",
        );
      } else if (statusCode === 403) {
        throw new Error(
          "API access denied. Please check your API key configuration.",
        );
      } else if (statusCode === 429 || statusCode === 503) {
        throw new Error(
          "AI service is temporarily overloaded. Please try again in a few moments.",
        );
      }

      throw new Error(`API error: ${statusCode}`);
    }

    const geminiResult = await geminiResponse.json();

    // Extract the text content from Gemini response
    const textContent = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error("No content received from Gemini API:", geminiResult);
      throw new Error("No content received from AI. Please try again.");
    }

    // Parse the JSON response from Gemini
    let parsedResult;
    try {
      // First try direct parsing
      parsedResult = JSON.parse(textContent);
    } catch (parseError) {
      console.error(
        "Failed to parse Gemini JSON response:",
        textContent,
        parseError,
      );

      // Enhanced JSON extraction and fixing
      try {
        let jsonStr = textContent.trim();

        // Extract JSON object if it's embedded in other text
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        // Advanced truncation handling for medication API
        if (!jsonStr.endsWith("}") || jsonStr.includes("SyntaxError")) {
          console.log(
            "Handling truncated/malformed JSON:",
            jsonStr.substring(0, 200) + "...",
          );

          // Find all complete field-value pairs
          const fieldNames = [
            "safetyAnalysis",
            "benefits",
            "risks",
            "fdaCategory",
            "overallSafety",
          ];
          // Define medication analysis interface
          interface MedicationAnalysis {
            safetyAnalysis: string;
            benefits: string;
            risks: string;
            fdaCategory: string;
            overallSafety: string;
          }

          const extractedFields: MedicationAnalysis = {
            safetyAnalysis: "",
            benefits: "",
            risks: "",
            fdaCategory: "",
            overallSafety: "",
          };

          // Enhanced regex to handle multiline values and escaped quotes
          fieldNames.forEach((field) => {
            const patterns = [
              new RegExp(`"${field}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, "g"),
              new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, "g"),
            ];

            for (const pattern of patterns) {
              const matches = [...jsonStr.matchAll(pattern)];
              if (matches.length > 0) {
                // Take the last match (most complete)
                const lastMatch = matches[matches.length - 1];
                if (lastMatch[1] && lastMatch[1].length > 10) {
                  // Ensure meaningful content
                  extractedFields[field as keyof MedicationAnalysis] =
                    lastMatch[1].replace(/\\"/g, '"'); // Unescape quotes
                  break;
                }
              }
            }
          });

          // Define comprehensive defaults with valid FDA categories only
          const defaults: MedicationAnalysis = {
            safetyAnalysis:
              language === "ar"
                ? "تحليل أمان الدواء متاح ولكن قد يحتاج مراجعة طبية متخصصة. يُنصح بمناقشة الدواء مع طبيب النساء والولادة للحصول على تقييم شامل يأخذ في الاعتبار الحالة الصحية الخاصة."
                : "Medication safety analysis is available but may require specialized medical review. It is recommended to discuss this medication with your obstetrician for comprehensive assessment considering your specific health condition.",
            benefits:
              language === "ar"
                ? "فوائد هذا الدواء تعتمد على نوعه والحالة الطبية المراد علاجها. معظم الأدوية لها فوائد علاجية محددة عند استخدامها بالجرعة والطريقة الصحيحة تحت إشراف طبي."
                : "Benefits of this medication depend on its type and the medical condition being treated. Most medications have specific therapeutic benefits when used at the correct dosage and method under medical supervision.",
            risks:
              language === "ar"
                ? "المخاطر المحتملة للأدوية أثناء الحمل تختلف حسب نوع الدواء، الجرعة، ومرحلة الحمل. من المهم جداً مناقشة أي مخاطر محتملة مع الطبيب المتخصص."
                : "Potential risks of medications during pregnancy vary depending on the type of medication, dosage, and stage of pregnancy. It is very important to discuss any potential risks with a healthcare specialist.",
            fdaCategory: "C", // Use default valid FDA category
            overallSafety:
              language === "ar"
                ? "الأمان العام للدواء يتطلب تقييماً طبياً متخصصاً. يُنصح بشدة بعدم تناول أي دواء أثناء الحمل بدون استشارة طبية مسبقة."
                : "Overall medication safety requires specialized medical assessment. It is strongly recommended not to take any medication during pregnancy without prior medical consultation.",
          };

          // Fill missing fields with defaults
          fieldNames.forEach((field) => {
            const fieldKey = field as keyof MedicationAnalysis;
            if (
              !extractedFields[fieldKey] ||
              extractedFields[fieldKey].length < 5
            ) {
              extractedFields[fieldKey] = defaults[fieldKey];
            }
          });

          // Ensure all required fields are present
          const requiredFields: (keyof MedicationAnalysis)[] = [
            "safetyAnalysis",
            "benefits",
            "risks",
            "fdaCategory",
            "overallSafety",
          ];
          requiredFields.forEach((field) => {
            if (!extractedFields[field]) {
              extractedFields[field] = defaults[field];
            }
          });

          jsonStr = JSON.stringify(extractedFields, null, 2);
          console.log("Reconstructed medication JSON with enhanced handling");
        }

        // Clean up any remaining issues
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas
        jsonStr = jsonStr.replace(/[\r\n]+/g, " "); // Replace newlines with spaces
        jsonStr = jsonStr.replace(/\\\\/g, "\\"); // Fix double escapes

        // Try parsing the cleaned JSON
        parsedResult = JSON.parse(jsonStr);
        console.log("Successfully parsed after cleanup:", parsedResult);
      } catch (secondParseError) {
        console.error("Second JSON parse attempt failed:", secondParseError);

        // Create a fallback response with required fields
        parsedResult = {
          safetyAnalysis:
            "تحليل الأمان للدواء قيد المعالجة. يُنصح بمراجعة الطبيب المختص.",
          benefits:
            "فوائد الدواء تختلف حسب نوعه. استشر طبيبك للحصول على معلومات دقيقة.",
          risks: "المخاطر تختلف حسب نوع الدواء ومرحلة الحمل. استشر طبيبك.",
          fdaCategory: "غير محدد",
          overallSafety:
            "يُنصح بمراجعة الطبيب المختص قبل تناول أي دواء أثناء الحمل.",
        };
        console.log("Using fallback response due to parsing failure");
      }
    }

    // Validate the response structure with more flexibility
    if (!parsedResult || typeof parsedResult !== "object") {
      console.error("Invalid response format from AI:", parsedResult);

      // Return a fallback response instead of throwing an error
      parsedResult = {
        safetyAnalysis:
          "تحليل الأمان للدواء متاح. يُنصح بمراجعة الطبيب المختص للحصول على تقييم شامل.",
        benefits:
          "فوائد الدواء تختلف حسب نوعه. استشر طبيبك للحصول على معلومات دقيقة.",
        risks:
          "المخاطر تختلف حسب نوع الدواء ومرحلة الحمل. من المهم مناقشة هذا مع طبيبك.",
        fdaCategory: "غير محدد",
        overallSafety:
          "يُنصح بمراجعة الطبيب المختص قبل تناول أي دواء أثناء الحمل.",
      };
    }

    // Helper function to validate and clean FDA category
    const validateFDACategory = (category: string): string => {
      const validCategories = ["A", "B", "C", "D", "X"];
      // Remove any non-alphabetic characters and convert to uppercase
      const cleanedCategory = category?.replace(/[^A-Za-z]/g, "").toUpperCase();

      if (validCategories.includes(cleanedCategory)) {
        return cleanedCategory;
      }

      // Default to C if invalid or unknown
      return "C";
    };

    // Fill in missing fields with defaults
    if (!parsedResult.safetyAnalysis) {
      parsedResult.safetyAnalysis =
        "تحليل الأمان للدواء متاح. يُنصح بمراجعة الطبيب المختص.";
    }
    if (!parsedResult.benefits) {
      parsedResult.benefits =
        "فوائد الدواء تختلف حسب نوعه. استشر طبيبك للحصول على معلومات دقيقة.";
    }
    if (!parsedResult.risks) {
      parsedResult.risks =
        "المخاطر تختلف حسب نوع الدواء ومرحلة الحمل. استشر طبيبك.";
    }
    // Validate and clean FDA category
    parsedResult.fdaCategory = validateFDACategory(
      parsedResult.fdaCategory || "C",
    );

    if (!parsedResult.overallSafety) {
      parsedResult.overallSafety =
        "يُنصح بمراجعة الطبيب المختص قبل تناول أي دواء أثناء الحمل.";
    }

    // Save to database with comprehensive error handling
    try {
      console.log("💾 Attempting to save medication to database...");

      // Create authenticated Supabase client with user token
      const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
        global: {
          headers: {
            Authorization: authorization || "",
          },
        },
      });

      // Get active pregnancy for proper linking
      let pregnancy_id = null;
      try {
        const { data: pregnancyData } = await userSupabase
          .from("pregnancies")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (pregnancyData) {
          pregnancy_id = pregnancyData.id;
        }
      } catch (pregError) {
        console.log("No active pregnancy found for user");
      }

      const supabaseInsertData = {
        user_id: userId,
        pregnancy_id,
        name: medicationName,
        dosage: "Not specified",
        frequency: "As needed",
        prescribed_date: new Date().toISOString().split("T")[0],
        fda_category: parsedResult.fdaCategory || "B",
        fda_category_ai: parsedResult.fdaCategory || null,
        llm_safety_analysis: parsedResult.safetyAnalysis || null,
        llm_benefits: parsedResult.benefits || null,
        llm_risks: parsedResult.risks || null,
        overall_safety: parsedResult.overallSafety || null,
      };

      const { data: medicationData, error: medicationError } =
        await userSupabase
          .from("medications")
          .insert([supabaseInsertData])
          .select()
          .single();

      if (medicationError) {
        console.error("❌ Database save failed:", medicationError);
        // Don't fail the request, just log the error
        console.log("⚠️ Continuing without database save");
      } else {
        console.log("✅ Medication saved to database:", medicationData?.id);
      }
    } catch (dbError) {
      console.error("❌ Database operation error:", dbError);
      console.log("⚠️ Continuing without database save");
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        safetyAnalysis: parsedResult.safetyAnalysis,
        benefits: parsedResult.benefits,
        risks: parsedResult.risks,
        fdaCategory: parsedResult.fdaCategory,
        overallSafety: parsedResult.overallSafety,
      }),
      {
        status: 200,
        headers,
      },
    );
  } catch (error) {
    console.error("Error analyzing medication safety:", error);

    // Return specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: `Failed to analyze medication safety: ${errorMessage}`,
      }),
      {
        status: 500,
        headers,
      },
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-goog-api-key",
    },
  });
}
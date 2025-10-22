import { assembleUserContext, saveGeminiPayload } from "../utils/contextAssembly";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic validation functions (inline)
function validateSymptomData(data: any) {
  const errors = [];
  const warnings = [];

  if (!data.type) errors.push("Symptom type is required");
  if (data.severity !== undefined && (data.severity < 1 || data.severity > 5)) {
    errors.push("Severity must be between 1 and 5");
  }
  if (
    data.pregnancyWeek !== undefined &&
    (data.pregnancyWeek < 0 || data.pregnancyWeek > 42)
  ) {
    warnings.push("Pregnancy week should be between 0 and 42");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

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
    // Parse request body
    const body = await request.json();
    console.log("Received symptom API request body:", JSON.stringify(body, null, 2));

    const {
      symptom,
      userId: requestUserId,
      pregnancyWeek = 0,
      medications = [],
      labReports = [],
      language = "en",
    } = body;

    // Extract user ID from Authorization header for context assembly
    const authHeader = request.headers.get("Authorization");
    let userId = requestUserId || null;

    if (!userId && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        // Validate session before proceeding
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Try to get user from token as fallback
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
          }
        } else {
          userId = session.user.id;
        }
      } catch (error) {
        console.log("Error extracting user from token:", error);
      }
    }

    // If no user ID, return error
    if (!userId) {
      console.error("No authenticated user found for symptom analysis");
      return new Response(
        JSON.stringify({
          error: "Authentication required. Please log in and try again.",
          code: "AUTH_REQUIRED"
        }),
        {
          status: 401,
          headers,
        },
      );
    }

    // Context assembly is already imported at the top

    // تحديد البيانات من الكائن أو الحقول المنفصلة
    const finalSymptom = symptom || {
      type: symptom?.type, // Use optional chaining for safety
      severity: symptom?.severity,
      description: symptom?.description,
      triggers: symptom?.triggers
    };

    console.log("Final symptom data for validation:", finalSymptom);

    // Comprehensive validation
    const validationResult = validateSymptomData({
      type: finalSymptom?.type,
      severity: finalSymptom?.severity,
      pregnancyWeek,
    });

    if (!validationResult.isValid) {
      console.log("Symptom validation failed:", validationResult.errors);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.errors,
          code: "INVALID_SYMPTOM_DATA",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    // Log warnings but continue processing
    if (validationResult.warnings.length > 0) {
      console.warn("Symptom validation warnings:", validationResult.warnings);
    }

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

    // Basic required field check (after validation)
    if (!finalSymptom || !finalSymptom.type || pregnancyWeek === undefined) {
      console.error("Missing required fields:", {
        hasSymptom: !!finalSymptom,
        hasType: !!finalSymptom?.type,
        pregnancyWeek
      });
      return new Response(
        JSON.stringify({
          error: "Missing required fields: symptom type and pregnancyWeek are required",
          received: {
            symptomType: finalSymptom?.type,
            pregnancyWeek
          }
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    console.log(
      "Analyzing symptom:",
      finalSymptom.type,
      "at week",
      pregnancyWeek,
      "in language:",
      language,
    );

    // Extract access token from Authorization header
    const authorizationHeader = request.headers.get("authorization");
    const accessToken = authorizationHeader?.startsWith("Bearer ") 
      ? authorizationHeader.substring(7) 
      : undefined;

    // Assemble user context from database
    let userContext = null;
    if (userId) {
      console.log("🔍 Assembling user context for userId:", userId);
      userContext = await assembleUserContext(userId, accessToken);
      console.log("📊 Assembled user context for symptom:", {
        hasContext: !!userContext,
        pregnancyWeek: userContext?.pregnancyWeek,
        isPregnant: userContext?.userContext?.isPregnant,
        medicationCount: userContext?.currentMedications?.length || 0,
        labResultCount: userContext?.recentLabResults?.length || 0,
        labReportCount: userContext?.recentLabReports?.length || 0,
        fullContext: userContext ? JSON.stringify(userContext, null, 2).substring(0, 500) : 'null'
      });
    } else {
      console.warn("⚠️ No userId provided for context assembly");
    }

    // IMPORTANT: Always prefer server-assembled context over client-provided data
    // This ensures we have the most up-to-date data from the database
    const finalPregnancyWeek = userContext?.pregnancyWeek || pregnancyWeek || 0;
    const finalMedications = userContext?.currentMedications || medications || [];
    const finalLabReports = userContext?.recentLabResults || labReports || [];

    console.log("✅ Final context after assembly:", {
      pregnancyWeek: finalPregnancyWeek,
      medicationCount: finalMedications.length,
      labResultCount: finalLabReports.length,
      medications: finalMedications.map((m: any) => ({ name: m.name, dosage: m.dosage })),
      labReports: finalLabReports.slice(0, 2).map((r: any) => ({ 
        test: r.test_name, 
        value: r.value,
        date: r.date 
      }))
    });

    console.log("Final context for symptom analysis:", {
      pregnancyWeek: finalPregnancyWeek,
      medicationCount: finalMedications.length,
      labResultCount: finalLabReports.length,
      hasUserContext: !!userContext,
      symptomType: symptom?.type,
    });

    // Prepare context for analysis
    const medicationsContext =
      finalMedications && finalMedications.length > 0
        ? `Current medications:\n${finalMedications.map((med: any) => `- ${med.name} (${med.dosage || "dosage not specified"})`).join("\n")}`
        : "No current medications reported.";

    // Prepare enhanced lab reports context with last 3 reports
    const labReportsContext =
      userContext?.recentLabReports && userContext.recentLabReports.length > 0
        ? `Recent lab reports (last 3):\n${userContext.recentLabReports.map((report: any, idx: number) => 
            `${idx + 1}. ${report.date}: ${report.summary}${report.lab_results ? `\n   Key results: ${report.lab_results.slice(0, 3).map((r: any) => `${r.test_name}: ${r.value} ${r.unit}${r.is_abnormal ? ' (abnormal)' : ''}`).join(', ')}` : ''}`
          ).join("\n")}`
        : finalLabReports && finalLabReports.length > 0
          ? `Recent lab results:\n${finalLabReports.slice(0, 10).map((r: any) => `- ${r.test_name}: ${r.value} ${r.unit} (${r.date})${r.is_abnormal ? ' - abnormal' : ''}`).join("\n")}`
          : "No recent lab reports available.";

    // Create language-specific prompts
    const prompts = {
      ar: {
        systemPrompt: `أنت مساعد طبي ذكي متخصص في تحليل الأعراض أثناء الحمل مع خبرة واسعة في طب النساء والتوليد. قم بتحليل العرض التالي لامرأة حامل في الأسبوع ${finalPregnancyWeek} من الحمل.

تفاصيل العرض:
- نوع العرض: ${finalSymptom.type}
- شدة العرض: ${finalSymptom.severity}/5
- الوصف التفصيلي: ${finalSymptom.description || "غير محدد"}
- المحفزات المحتملة: ${finalSymptom.triggers || "غير محدد"}

السياق الطبي الحالي:
${medicationsContext}
${labReportsContext}

مهم جداً: قدم تحليلاً طبياً شاملاً باللغة العربية يشمل:

1. التحليل الطبي المتخصص: 
   - تقييم العرض في سياق المرحلة الحالية من الحمل (الأسبوع ${finalPregnancyWeek})
   - الأسباب الطبية المحتملة (فسيولوجية أم مرضية)
   - مستوى الخطورة والحاجة للتدخل الطبي
   - العلاقة بين العرض والأدوية الحالية أو نتائج التحاليل

2. التوصيات العلاجية والوقائية:
   - خطوات الرعاية الذاتية المناسبة والآمنة للحامل
   - تعديلات نمط الحياة والتغذية
   - علامات الإنذار التي تستدعي مراجعة الطبيب فوراً
   - الجدول الزمني للمتابعة الطبية

أساس تحليلك على الأدلة العلمية الحديثة والإرشادات الطبية المعتمدة. انصح دائماً بالتشاور مع الطبيب المختص.

أرجع فقط JSON صالح بهذا التنسيق بالضبط باللغة العربية:
{
  "analysis": "تحليل طبي مفصل وشامل للعرض في سياق الحمل يشمل الأسباب المحتملة ومستوى الخطورة في 4-5 جمل مفصلة",
  "recommendations": "توصيات علاجية ووقائية شاملة تشمل الرعاية الذاتية وعلامات الإنذار ومتى يجب مراجعة الطبيب في 4-5 جمل مفصلة"
}`,
      },
      en: {
        systemPrompt: `You are a specialized medical AI assistant with extensive expertise in obstetrics and gynecology, focusing on pregnancy symptom analysis. Analyze the following symptom for a pregnant woman at ${finalPregnancyWeek} weeks of pregnancy.

Symptom Details:
- Symptom Type: ${finalSymptom.type}
- Severity Level: ${finalSymptom.severity}/5
- Detailed Description: ${finalSymptom.description || "Not specified"}
- Potential Triggers: ${finalSymptom.triggers || "Not specified"}

Current Medical Context:
${medicationsContext}
${labReportsContext}

IMPORTANT: Provide a comprehensive medical analysis in English including:

1. Specialized Medical Analysis:
   - Symptom assessment in the context of current pregnancy stage (week ${finalPregnancyWeek})
   - Potential medical causes (physiological vs pathological)
   - Risk level and need for medical intervention
   - Relationship between symptom and current medications or lab results

2. Therapeutic and Preventive Recommendations:
   - Appropriate and safe self-care steps for pregnant women
   - Lifestyle and nutritional modifications
   - Warning signs requiring immediate medical attention
   - Timeline for medical follow-up

Base your analysis on current evidence-based medicine and established medical guidelines. Always recommend consulting with healthcare professionals.

Return ONLY valid JSON in this exact format in English:
{
  "analysis": "comprehensive and detailed medical analysis of the symptom in pregnancy context including potential causes and risk level in 4-5 detailed sentences",
  "recommendations": "comprehensive therapeutic and preventive recommendations including self-care, warning signs, and when to consult a doctor in 4-5 detailed sentences"
}`,
      },
    };

    const currentPrompt =
      prompts[language as keyof typeof prompts] || prompts.en;

    // Construct final Gemini payload with complete context
    const finalGeminiPayload = {
      symptom: finalSymptom,
      medications: finalMedications,
      labReports: finalLabReports,
      pregnancyWeek: finalPregnancyWeek,
      language,
      ...userContext, // Spread user context (includes profile, userContext, userId, etc.)
      // Standardized field names for verification
      labResults: finalLabReports,
      timestamp: new Date().toISOString(),
    };

    // Save the final payload for testing (without secrets)
    saveGeminiPayload(finalGeminiPayload, "symptom");

    // Call Gemini API with retry mechanism for symptom analysis
    let geminiResponse;
    let lastError;
    const maxRetries = 3;
    const requestTimeout = 120000; // 2 minutes timeout

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Symptom API attempt ${attempt}/${maxRetries}`);

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
                temperature: 0.2, // Lower for consistency
                topK: 32,
                topP: 0.9,
                maxOutputTokens: 8192, // Significantly increased
                responseMimeType: "application/json",
                responseSchema: {
                  type: "object",
                  properties: {
                    analysis: {
                      type: "string",
                      description:
                        "Detailed symptom analysis in pregnancy context",
                    },
                    recommendations: {
                      type: "string",
                      description:
                        "Recommendations for self-care and next steps",
                    },
                  },
                  required: ["analysis", "recommendations"],
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: "You are a medical AI specialized in pregnancy symptom analysis. Always return complete, valid JSON with detailed analysis and recommendations. Ensure JSON is properly formatted and closed.",
                  },
                ],
              },
            }),
          },
        );

        clearTimeout(timeoutId);
        console.log(
          `Symptom API attempt ${attempt} response status:`,
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
          `Symptom API attempt ${attempt} failed with status ${geminiResponse.status}, retrying...`,
        );

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const waitTime = Math.min(Math.pow(2, attempt) * 2000, 15000); // Max 15s wait
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } catch (fetchError: any) {
        console.error(
          `Symptom API attempt ${attempt} failed with fetch error:`,
          fetchError,
        );
        lastError = {
          status: 500,
          errorText: `Network error: ${fetchError?.message || "Unknown error"}`,
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

      console.error("Symptom API error after retries:", {
        status: statusCode,
        errorText,
      });

      if (statusCode === 400) {
        throw new Error(
          "Invalid request. Please check the symptom information and try again.",
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
      console.log('✅ AI analysis completed successfully');
    } catch (parseError) {
      console.error(
        "Failed to parse Gemini JSON response:",
        textContent,
        parseError,
      );

      // Try to extract and fix malformed JSON
      try {
        let jsonStr = textContent;

        // Extract JSON object if it's embedded in other text
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        // Handle specific truncation patterns for symptom API
        if (!jsonStr.endsWith("}")) {
          console.log("Handling truncated JSON for symptom:", jsonStr);

          // Try to find complete analysis and recommendations fields
          const analysisMatch = jsonStr.match(/"analysis":"([^"]*)"/);
          const recommendationsMatch = jsonStr.match(
            /"recommendations":"([^"]*)"/,
          );

          const extractedFields: { analysis: string; recommendations: string } =
            {
              analysis: "",
              recommendations: "",
            };

          if (analysisMatch) {
            extractedFields.analysis = analysisMatch[1];
          } else {
            extractedFields.analysis =
              "تحليل العرض قيد المعالجة. العرض المذكور يمكن أن يكون طبيعياً في الحمل ولكن يُنصح بمراجعة الطبيب المختص للتقييم الدقيق.";
          }

          if (recommendationsMatch) {
            extractedFields.recommendations = recommendationsMatch[1];
          } else {
            extractedFields.recommendations =
              "يُنصح بالراحة وتجنب الأوضاع المؤلمة ومراجعة الطبيب المختص إذا استمر العرض أو ازداد سوءاً. تجنب الأدوية بدون استشارة طبية.";
          }

          jsonStr = JSON.stringify(extractedFields);
          console.log("Reconstructed JSON for symptom:", jsonStr);
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
          analysis:
            "تحليل العرض قيد المعالجة. العرض المذكور يمكن أن يكون طبيعياً في الحمل ولكن يُنصح بمراجعة الطبيب المختص للتقييم الدقيق.",
          recommendations:
            "يُنصح بالراحة وتجنب الأوضاع المؤلمة ومراجعة الطبيب المختص إذا استمر العرض أو ازداد سوءاً. تجنب الأدوية بدون استشارة طبية.",
        };
        console.log("Using fallback response due to parsing failure");
      }
    }

    // Validate the response structure with more flexibility
    if (!parsedResult || typeof parsedResult !== "object") {
      console.error("Invalid response format from AI:", parsedResult);

      // Return a fallback response instead of throwing an error
      parsedResult = {
        analysis:
          "تحليل العرض قيد المعالجة. العرض المذكور يمكن أن يكون طبيعياً في الحمل ولكن يُنصح بمراجعة الطبيب المختص للتقييم الدقيق.",
        recommendations:
          "يُنصح بالراحة وتجنب الأوضاع المؤلمة ومراجعة الطبيب المختص إذا استمر العرض أو ازداد سوءاً. تجنب الأدوية بدون استشارة طبية.",
      };
    }

    // Ensure parsedResult has the expected structure
    if (!parsedResult || typeof parsedResult !== "object") {
      parsedResult = {};
    }

    // Fill in missing fields with defaults
    if (!("analysis" in parsedResult) || !parsedResult.analysis) {
      parsedResult.analysis =
        "تحليل العرض قيد المعالجة. العرض المذكور يمكن أن يكون طبيعياً في الحمل ولكن يُنصح بمراجعة الطبيب المختص للتقييم الدقيق.";
    }
    if (!("recommendations" in parsedResult) || !parsedResult.recommendations) {
      parsedResult.recommendations =
        "يُنصح بالراحة وتجنب الأوضاع المؤلمة ومراجعة الطبيب المختص إذا استمر العرض أو ازداد سوءاً. تجنب الأدوية بدون استشارة طبية.";
    }

    // Save to database with proper error handling and retry mechanism
    let dbSaveSuccess = false;
    let retryAttempts = 0;
    const maxDbRetries = 3;

    while (retryAttempts < maxDbRetries && !dbSaveSuccess) {
      try {
        console.log(
          `💾 Saving symptom to database (attempt ${retryAttempts + 1}/${maxDbRetries})...`,
        );

        // Create authenticated Supabase client with user token
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: authHeader || "",
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

        const symptomData = {
          user_id: userId,
          pregnancy_id,
          date: finalSymptom.date || new Date().toISOString().split("T")[0],
          type: finalSymptom.type,
          severity: parseInt(finalSymptom.severity),
          description: finalSymptom.description || "",
          triggers: finalSymptom.triggers || null,
          llm_analysis: parsedResult.analysis || null,
          llm_recommendations: parsedResult.recommendations || null,
        };

        console.log("About to save symptom with user_id:", userId, "and analysis:", !!parsedResult.analysis);

        console.log("Symptom data to save:", {
          ...symptomData,
          llm_analysis: symptomData.llm_analysis
            ? `${symptomData.llm_analysis.substring(0, 50)}...`
            : null,
          llm_recommendations: symptomData.llm_recommendations
            ? `${symptomData.llm_recommendations.substring(0, 50)}...`
            : null,
        });

        // Add timeout to database operation
        const dbSavePromise = userSupabase
          .from("symptoms")
          .insert([symptomData])
          .select()
          .single();

        const dbTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Database save timeout")), 10000),
        );

        const { data: savedSymptom, error: saveError } = (await Promise.race([
          dbSavePromise,
          dbTimeoutPromise,
        ])) as any;

        if (saveError) {
          console.error("❌ Failed to save symptom:", {
            code: (saveError as any)?.code,
            message: (saveError as any)?.message,
            details: (saveError as any)?.details,
          });
          throw saveError;
        } else {
          console.log("✅ Symptom saved successfully:", {
            id: savedSymptom?.id,
            hasAnalysis: !!savedSymptom?.llm_analysis,
            hasRecommendations: !!savedSymptom?.llm_recommendations,
          });
          dbSaveSuccess = true;
        }
      } catch (dbError) {
        console.error(`❌ Database save attempt ${retryAttempts + 1} failed:`, {
          message: (dbError as any)?.message || "Unknown error",
          code: (dbError as any)?.code || "NO_CODE",
        });

        retryAttempts++;

        if (retryAttempts >= maxDbRetries) {
          console.log(
            "⚠️ All database save attempts failed, continuing without database save",
          );
          break;
        }

        // Wait before retry
        const waitTime = 1000 * retryAttempts;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        analysis: parsedResult?.analysis || "",
        recommendations: parsedResult?.recommendations || "",
      }),
      {
        status: 200,
        headers,
      },
    );
  } catch (error) {
    console.error("Error analyzing symptom:", error);

    // Return specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: `Failed to analyze symptom: ${errorMessage}`,
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
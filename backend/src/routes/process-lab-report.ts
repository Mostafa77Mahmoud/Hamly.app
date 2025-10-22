import { Buffer } from "buffer";
import { assembleUserContext } from "../utils/contextAssembly";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        (request.headers.get("access-control-request-headers") as string) ||
        "Content-Type, Authorization, x-goog-api-key, ngrok-skip-browser-warning, User-Agent",
    },
  });
}

export async function POST(request: Request) {
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
    console.log("Parsing request body");
    const body = await request.json();
    const { image, mimeType, language = "ar" } = body;

    // Extract user ID from Authorization header for context assembly
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // For Expo/React Native, we can get user ID from the JWT token
        const token = authHeader.replace("Bearer ", "");
        // Simple JWT decode (production should use proper JWT verification)
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString("utf8"),
        );
        userId = payload.sub;
        console.log("Extracted user ID from token:", userId);
      } catch (tokenError) {
        console.warn("Could not extract user ID from token:", tokenError);
      }
    }

    // Import context assembly utility
    const { assembleUserContext, saveGeminiPayload } = await import(
      "../utils/contextAssembly"
    );

    if (!image || !mimeType) {
      console.log("Missing required fields:", {
        image: !!image,
        mimeType: !!mimeType,
      });
      return new Response(
        JSON.stringify({ error: "Missing image or mimeType" }),
        {
          status: 400,
          headers,
        },
      );
    }

    console.log("Validating file size", { base64Length: image.length });
    if (image.length > 1_500_000) {
      return new Response(JSON.stringify({ error: "File too large" }), {
        status: 400,
        headers,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("Missing GEMINI_API_KEY");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing API key",
        }),
        {
          status: 500,
          headers,
        },
      );
    }

    // Determine MIME type
    let detectedMimeType = mimeType || "image/jpeg";
    if (!mimeType && image) {
      const pdfSignature = "JVBERi0"; // Base64 for "%PDF-"
      if (image.startsWith(pdfSignature)) {
        detectedMimeType = "application/pdf";
      }
    }

    console.log(
      "Processing document with MIME type:",
      detectedMimeType,
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
    let pregnancyWeek = 0;
    if (userId) {
      userContext = await assembleUserContext(userId, accessToken);

      // Calculate pregnancy week properly with detailed logging
      if (userContext?.pregnancyWeek) {
        pregnancyWeek = userContext.pregnancyWeek;
        console.log(
          "Pregnancy week from userContext.pregnancyWeek:",
          pregnancyWeek,
        );
      } else if (userContext?.userContext?.pregnancyWeek) {
        pregnancyWeek = userContext.userContext.pregnancyWeek;
        console.log(
          "Pregnancy week from userContext.userContext.pregnancyWeek:",
          pregnancyWeek,
        );
      } else {
        console.log("No pregnancy week found in context, using 0");
      }

      console.log("Assembled user context:", {
        hasContext: !!userContext,
        pregnancyWeek: pregnancyWeek,
        medicationCount: userContext?.currentMedications?.length || 0,
        labResultCount: userContext?.recentLabResults?.length || 0,
        fullContext: userContext ? Object.keys(userContext) : [],
      });
    }

    // Language-specific prompts
    const prompts = {
      ar: {
        systemPrompt: `أنت مساعد طبي ذكي متخصص في تحليل تقارير المختبر للحوامل مع خبرة واسعة في الطب المخبري وطب النساء والتوليد. استخرج وحلل جميع نتائج الفحوصات المختبرية من هذه الوثيقة الطبية وقدم تفسيرات طبية متخصصة.

مهم جداً: يجب أن تكون إجابتك باللغة العربية بالكامل وتعتمد على الأدلة العلمية الحديثة.

مطلوب منك:
1. استخراج تاريخ التقرير بدقة (تاريخ إنشاء أو إصدار تقرير المختبر وليس تواريخ أخرى)
2. تحليل شامل لكل فحص مختبري

لكل فحص قم بتقديم:
- اسم الفحص الدقيق باللغة العربية
- القيمة الرقمية الدقيقة
- الوحدة المستخدمة
- المدى المرجعي الطبيعي
- التصنيف (دم، بول، موجات فوق صوتية، وراثي، أو أخرى)
- تقييم ما إذا كانت النتيجة ضمن المعدل الطبيعي أم لا
- أي ملاحظات طبية مهمة

للنتائج غير الطبيعية فقط: قدم تفسيراً طبياً متخصصاً يشمل:
- الدلالة الطبية في سياق الحمل
- المخاطر المحتملة على الأم والجنين
- التوصيات والخطوات العلاجية المطلوبة
- الحاجة للمتابعة الطبية

أرجع JSON صالح بالتنسيق التالي باللغة العربية:
{
  "reportDate": "YYYY-MM-DD",
  "tests": [
    {
      "testName": "اسم الفحص الدقيق باللغة العربية",
      "value": "القيمة الرقمية كنص",
      "unit": "الوحدة المستخدمة",
      "referenceRange": "المدى المرجعي الطبيعي",
      "category": "blood|urine|ultrasound|genetic|other",
      "isAbnormal": "صحيح أو خطأ",
      "notes": "ملاحظات طبية مهمة",
      "explanation": "تفسير طبي مفصل للنتائج غير الطبيعية فقط - يشمل الدلالة الطبية والمخاطر والتوصيات"
    }
  ],
  "summary": "ملخص طبي شامل يشرح الغرض من الفحوصات في سياق الحمل ويبرز أي مخاوف طبية مهمة مع التوصيات العامة"
}`,
      },
      en: {
        systemPrompt: `You are a specialized medical AI assistant with extensive expertise in laboratory medicine and obstetrics/gynecology, focusing on prenatal lab report analysis. Extract and analyze all laboratory test results from this medical document and provide expert medical interpretations.

IMPORTANT: Your entire response must be in English and based on current evidence-based medicine.

Required tasks:
1. Accurately extract the report date (lab report creation or issue date, not other dates)
2. Comprehensive analysis of each laboratory test

For each test provide:
- Precise test name in English
- Exact numerical value
- Unit of measurement
- Normal reference range
- Category classification (blood, urine, ultrasound, genetic, or other)
- Assessment of whether result is within normal range
- Any important medical notes

For abnormal results only: provide expert medical interpretation including:
- Medical significance in pregnancy context
- Potential risks to mother and fetus
- Required therapeutic recommendations and next steps
- Need for medical follow-up

Return ONLY valid JSON in this exact format in English:
{
  "reportDate": "YYYY-MM-DD",
  "tests": [
    {
      "testName": "precise test name in English",
      "value": "numerical value as string",
      "unit": "unit of measurement",
      "referenceRange": "normal reference range",
      "category": "blood|urine|ultrasound|genetic|other",
      "isAbnormal": "true or false",
      "notes": "important medical notes",
      "explanation": "detailed medical interpretation for abnormal results only - including medical significance, risks, and recommendations"
    }
  ],
  "summary": "comprehensive medical summary explaining the purpose of tests in pregnancy context and highlighting any important medical concerns with general recommendations"
}`,
      },
    };

    const currentPrompt =
      prompts[language as keyof typeof prompts] || prompts.en;

    // Construct final Gemini payload with complete context
    const finalGeminiPayload = {
      image,
      mimeType: detectedMimeType,
      language,
      ...userContext, // Spread user context (includes profile, userContext, pregnancyWeek, userId, etc.)
      timestamp: new Date().toISOString(),
    };

    // Save the final payload for testing (without secrets)
    saveGeminiPayload(finalGeminiPayload, "lab-report");

    console.log("Calling Gemini API", {
      mimeType: detectedMimeType,
      language,
      pregnancyWeek,
    });

    // Retry mechanism with exponential backoff for overloaded API
    let response;
    let lastError;
    const maxRetries = 3; // Standardized with other AI APIs for consistency
    const requestTimeout = 120000; // 2 minutes timeout (consistent with other APIs)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${maxRetries}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        response = await fetch(
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
                    { text: currentPrompt.systemPrompt },
                    ...(userContext
                      ? [
                          {
                            text: `\n\nمعلومات المريضة السريرية:\n- معرف المريضة: ${userId}\n- أسبوع الحمل: ${pregnancyWeek}\n- الأدوية الحالية: ${userContext.currentMedications?.length ? userContext.currentMedications.map((m) => `${m.name} (${m.dosage}) - فئة الأمان: ${m.fda_category || "غير محدد"}`).join("، ") : "لا توجد أدوية"}\n- التحاليل السابقة (آخر 3 تقارير): ${
                              userContext.recentLabReports?.length
                                ? userContext.recentLabReports
                                    .map(
                                      (report) =>
                                        `\n  * ${report.date}: ${report.summary}${
                                          report.lab_results
                                            ? `\n    نتائج رئيسية: ${report.lab_results
                                                .slice(0, 3)
                                                .map(
                                                  (r: any) =>
                                                    `${r.test_name}: ${r.value} ${r.unit}${r.is_abnormal ? " (غير طبيعي)" : ""}`,
                                                )
                                                .join("، ")}`
                                            : ""
                                        }`,
                                    )
                                    .join("")
                                : userContext.recentLabResults?.length
                                  ? userContext.recentLabResults
                                      .slice(0, 5)
                                      .map(
                                        (r) =>
                                          `${r.test_name}: ${r.value} ${r.unit} (${r.date})${r.is_abnormal ? " - غير طبيعي" : ""}`,
                                      )
                                      .join("، ")
                                  : "لا توجد تحاليل سابقة"
                            }\n- ملاحظات إضافية: يرجى مراعاة هذا السياق الطبي الشامل ومقارنة التقرير الجديد بالتحاليل السابقة لتقديم تحليل أكثر دقة وتوصيات مناسبة للحمل في الأسبوع ${pregnancyWeek}.`,
                          },
                        ]
                      : []),
                    {
                      inlineData: {
                        mimeType: detectedMimeType,
                        data: image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 32768, // Significantly increased for lab reports
                temperature: 0.1, // Lower for more consistent structured output
                topK: 20,
                topP: 0.8,
                responseMimeType: "application/json",
                responseSchema: {
                  type: "object",
                  properties: {
                    reportDate: {
                      type: "string",
                      description: "Report date in YYYY-MM-DD format",
                    },
                    tests: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          testName: { type: "string" },
                          value: { type: "string" },
                          unit: { type: "string" },
                          referenceRange: { type: "string" },
                          category: {
                            type: "string",
                            enum: [
                              "blood",
                              "urine",
                              "ultrasound",
                              "genetic",
                              "other",
                            ],
                          },
                          isAbnormal: { type: "boolean" },
                          notes: { type: "string" },
                          explanation: { type: "string" },
                        },
                        required: [
                          "testName",
                          "value",
                          "category",
                          "isAbnormal",
                        ],
                      },
                    },
                    summary: {
                      type: "string",
                      description:
                        "Brief summary of tests and concerns in pregnancy context",
                    },
                  },
                  required: ["reportDate", "tests", "summary"],
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: "You are a medical AI specialized in pregnancy lab analysis. Always return complete, valid JSON. Be concise but medically accurate. Focus on pregnancy-specific interpretations.",
                  },
                ],
              },
            }),
          },
        );

        clearTimeout(timeoutId);
        console.log(
          `Gemini API attempt ${attempt} response status:`,
          response.status,
        );

        // If successful or non-retryable error, break the loop
        if (
          response.ok ||
          (response.status !== 503 && response.status !== 429)
        ) {
          break;
        }

        // Store error for potential retry
        const errorText = await response.text();
        lastError = { status: response.status, errorText };
        console.log(
          `Attempt ${attempt} failed with status ${response.status}, retrying...`,
        );

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const waitTime = Math.min(Math.pow(2, attempt) * 1000, 5000); // Max 5s wait
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } catch (fetchError: any) {
        console.error(
          `Attempt ${attempt} failed with fetch error:`,
          fetchError,
        );
        lastError = {
          status: 500,
          errorText: `Network error: ${fetchError?.message || "Unknown error"}`,
        };

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    console.log("Final Gemini API response status:", response?.status);
    if (!response?.ok) {
      // Use the last error from retry attempts
      const errorText = lastError?.errorText || "Unknown API error";
      const statusCode = lastError?.status || 500;

      console.error("Gemini API error after retries:", {
        status: statusCode,
        errorText,
      });

      return new Response(
        JSON.stringify({
          error:
            statusCode === 400
              ? errorText.includes("image") || errorText.includes("format")
                ? "Invalid file format. Please ensure the image is clear or the PDF contains readable text."
                : "Invalid request format. Please try a different file."
              : statusCode === 403
                ? "API access denied. Please check your API key configuration."
                : statusCode === 429 || statusCode === 503
                  ? "AI service is temporarily overloaded. Please try again in a few moments."
                  : `AI processing error: Unable to analyze the lab report at this time. Please try again.`,
        }),
        {
          status: statusCode === 503 ? 503 : 500,
          headers,
        },
      );
    }

    const result = await response.json();
    console.log("Gemini API raw result:", {
      result: JSON.stringify(result, null, 2),
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log("No valid text in Gemini response");
      return new Response(
        JSON.stringify({
          error:
            "No content received from AI. The document may not contain readable lab results.",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    let parsedResult;
    try {
      // First try direct parsing
      parsedResult = JSON.parse(text);
      console.log("Parsed JSON successfully:", parsedResult);
    } catch (parseError: unknown) {
      console.error("Failed to parse Gemini JSON response:", text, parseError);

      // Enhanced JSON extraction and recovery for lab reports
      try {
        let jsonStr = text.trim();

        // Extract JSON object if it's embedded in other text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        console.log("Attempting to fix truncated lab report JSON...");

        // Advanced truncation recovery
        if (
          !jsonStr.endsWith("}") ||
          jsonStr.includes("SyntaxError") ||
          jsonStr.includes('"testName": "الفير')
        ) {
          console.log("Detected truncated JSON, applying advanced recovery...");

          // Extract basic report info
          let reportDate = new Date().toISOString().split("T")[0];
          let summary =
            "نتائج التحاليل المعملية تم استخراجها بنجاح. يُنصح بمراجعة النتائج مع الطبيب المختص.";

          const reportDateMatch = jsonStr.match(/"reportDate"\s*:\s*"([^"]+)"/);
          if (reportDateMatch) reportDate = reportDateMatch[1];

          const summaryMatch = jsonStr.match(/"summary"\s*:\s*"([^"]+)"/);
          if (summaryMatch) summary = summaryMatch[1];

          // Extract complete test objects using more sophisticated parsing
          const completeTests = [];

          // Find all potential test objects
          const testPattern =
            /"testName"\s*:\s*"([^"]+)"[\s\S]*?"category"\s*:\s*"([^"]+)"[\s\S]*?"isAbnormal"\s*:\s*(true|false)/g;
          let match;

          while ((match = testPattern.exec(jsonStr)) !== null) {
            const testName = match[1];
            const category = match[2];
            const isAbnormal = match[3] === "true";

            // Extract additional fields for this test
            const testStartIndex = match.index;
            const nextTestIndex = jsonStr.indexOf(
              '"testName"',
              testStartIndex + 1,
            );
            const testEndIndex =
              nextTestIndex > 0 ? nextTestIndex : jsonStr.length;
            const testBlock = jsonStr.substring(testStartIndex, testEndIndex);

            // Extract other fields
            const valueMatch = testBlock.match(/"value"\s*:\s*"([^"]+)"/);
            const unitMatch = testBlock.match(/"unit"\s*:\s*"([^"]+)"/);
            const referenceRangeMatch = testBlock.match(
              /"referenceRange"\s*:\s*"([^"]+)"/,
            );
            const notesMatch = testBlock.match(/"notes"\s*:\s*"([^"]*)"/);
            const explanationMatch = testBlock.match(
              /"explanation"\s*:\s*"([^"]*)"/,
            );

            const testObj = {
              testName: testName,
              value: valueMatch ? valueMatch[1] : "غير محدد",
              unit: unitMatch ? unitMatch[1] : "N/A",
              referenceRange: referenceRangeMatch
                ? referenceRangeMatch[1]
                : "N/A",
              category: category,
              isAbnormal: isAbnormal,
              notes: notesMatch ? notesMatch[1] : "",
              explanation: explanationMatch ? explanationMatch[1] : "",
            };

            // Only add if we have meaningful data
            if (
              testName &&
              testName.length > 2 &&
              !testName.includes("الفير")
            ) {
              completeTests.push(testObj);
            }
          }

          // If no tests found through pattern matching, try a different approach
          if (completeTests.length === 0) {
            console.log(
              "Pattern matching failed, trying alternative extraction...",
            );

            // Look for tests array content
            const testsArrayMatch = jsonStr.match(
              /"tests"\s*:\s*\[([\s\S]*?)(?:\]|$)/,
            );
            if (testsArrayMatch) {
              const testsContent = testsArrayMatch[1];

              // Split by test objects more carefully
              const testBlocks = testsContent.split(/},\s*{/);

              testBlocks.forEach((block: string, index: number) => {
                // Add missing braces
                let testBlock = block.trim();
                if (index > 0 && !testBlock.startsWith("{"))
                  testBlock = "{" + testBlock;
                if (index < testBlocks.length - 1 && !testBlock.endsWith("}"))
                  testBlock = testBlock + "}";

                try {
                  const testObj = JSON.parse(testBlock);
                  if (
                    testObj.testName &&
                    testObj.category &&
                    typeof testObj.isAbnormal === "boolean" &&
                    !testObj.testName.includes("الفير") &&
                    testObj.testName.length > 2
                  ) {
                    // Ensure all required fields
                    testObj.value = testObj.value || "غير محدد";
                    testObj.unit = testObj.unit || "N/A";
                    testObj.referenceRange = testObj.referenceRange || "N/A";
                    testObj.notes = testObj.notes || "";
                    testObj.explanation = testObj.explanation || "";

                    completeTests.push(testObj);
                  }
                } catch (e) {
                  // Try to extract manually if JSON parse fails
                  const testNameMatch = testBlock.match(
                    /"testName"\s*:\s*"([^"]+)"/,
                  );
                  const categoryMatch = testBlock.match(
                    /"category"\s*:\s*"([^"]+)"/,
                  );
                  const isAbnormalMatch = testBlock.match(
                    /"isAbnormal"\s*:\s*(true|false)/,
                  );

                  if (
                    testNameMatch &&
                    categoryMatch &&
                    isAbnormalMatch &&
                    !testNameMatch[1].includes("الفير") &&
                    testNameMatch[1].length > 2
                  ) {
                    const valueMatch = testBlock.match(
                      /"value"\s*:\s*"([^"]+)"/,
                    );
                    const unitMatch = testBlock.match(/"unit"\s*:\s*"([^"]+)"/);

                    completeTests.push({
                      testName: testNameMatch[1],
                      value: valueMatch ? valueMatch[1] : "غير محدد",
                      unit: unitMatch ? unitMatch[1] : "N/A",
                      referenceRange: "N/A",
                      category: categoryMatch[1],
                      isAbnormal: isAbnormalMatch[1] === "true",
                      notes: "",
                      explanation: "",
                    });
                  }
                }
              });
            }
          }

          console.log(
            `Recovered ${completeTests.length} complete test objects`,
          );

          // Ensure we have at least some tests
          if (completeTests.length === 0) {
            console.log(
              "No complete tests recovered, creating minimal structure",
            );
            completeTests.push({
              testName: "تحليل مختبري",
              value: "قيد المعالجة",
              unit: "N/A",
              referenceRange: "N/A",
              category: "other",
              isAbnormal: false,
              notes:
                "تم استخراج التقرير جزئياً. يُرجى المراجعة مع الطبيب المختص.",
              explanation: "",
            });
          }

          // Reconstruct the complete JSON
          const reconstructedResult = {
            reportDate: reportDate,
            tests: completeTests,
            summary: summary,
          };

          jsonStr = JSON.stringify(reconstructedResult, null, 2);
          console.log(
            `Successfully reconstructed JSON with ${completeTests.length} tests`,
          );
        }

        // Final cleanup
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas
        jsonStr = jsonStr.replace(/[\r\n\t]+/g, " "); // Replace newlines and tabs with spaces
        jsonStr = jsonStr.replace(/\s+/g, " "); // Normalize whitespace

        // Try parsing the processed JSON
        parsedResult = JSON.parse(jsonStr);
        console.log("Successfully parsed lab report JSON:", {
          testsCount: parsedResult.tests?.length || 0,
          reportDate: parsedResult.reportDate,
        });
      } catch (secondParseError: unknown) {
        const errorMessage =
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error";
        console.error("Second JSON parse attempt failed:", secondParseError);
        console.log("Creating fallback response due to parsing failure");
        return new Response(
          JSON.stringify({
            error:
              "Failed to parse lab report data. The document may not contain standard lab results or the AI response was incomplete. Please try again.",
          }),
          {
            status: 500,
            headers,
          },
        );
      }
    }

    if (!parsedResult.tests || !Array.isArray(parsedResult.tests)) {
      console.log("No valid test results in parsed response:", parsedResult);
      return new Response(
        JSON.stringify({
          error: "No valid lab test results found in the document.",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    const validTests = parsedResult.tests
      .filter(
        (test: any) =>
          test.testName && test.value && typeof test.isAbnormal === "boolean",
      )
      .map((test: any) => ({
        ...test,
        unit: test.unit || "N/A",
        referenceRange: test.referenceRange || "N/A",
        notes: test.notes || "",
        explanation: test.explanation || "",
      }));

    if (validTests.length === 0) {
      console.log("No valid tests after filtering:", parsedResult.tests);
      return new Response(
        JSON.stringify({
          error:
            "No valid lab test results could be extracted from the document.",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    let reportDate = parsedResult.reportDate;
    if (!reportDate || !reportDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      reportDate = new Date().toISOString().split("T")[0];
      console.warn(
        "No valid report date found, using current date as fallback",
      );
    }

    console.log("Successfully extracted data:", {
      testsCount: validTests.length,
      reportDate,
    });
    return new Response(
      JSON.stringify({
        reportDate,
        tests: validTests,
        summary: parsedResult.summary || "Lab results extracted successfully.",
      }),
      {
        status: 200,
        headers,
      },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error processing lab report:", {
      message: errorMessage,
      stack: errorStack,
    });
    return new Response(
      JSON.stringify({
        error: `Failed to process lab report: ${errorMessage}`,
      }),
      {
        status: 500,
        headers,
      },
    );
  }
}

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  tableName: string;
  issueType: string;
  issueCount: number;
  details: string;
}

// Load environment variables from .env.local file
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=');
            process.env[key] = value;
          }
        }
      }
      console.log('✅ Loaded environment variables from .env.local');
    } else {
      console.warn('⚠️ .env.local file not found');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load .env.local:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Load environment variables first
loadEnvFile();

export class StandaloneValidator {
  private static getSupabaseClient() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing environment variables:
        EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '[SET]' : '[NOT SET]'}
        EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '[SET]' : '[NOT SET]'}
        
        Please ensure .env.local exists with the correct values.`);
    }
    
    return createClient(supabaseUrl, supabaseKey);
  }

  static async validateDatabaseConsistency(): Promise<{
    isValid: boolean;
    issues: ValidationResult[];
    summary: string;
  }> {
    console.log("🔍 Starting comprehensive database schema validation...");

    try {
      const supabase = this.getSupabaseClient();
      
      // 1. Test database connectivity
      const { data: connectTest, error: connectError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (connectError) {
        throw new Error(
          `Database connectivity failed: ${connectError.message}`,
        );
      }

      // 2. Validate all table schemas exist
      const requiredTables = [
        "profiles",
        "pregnancies",
        "medications",
        "symptoms",
        "lab_reports",
        "lab_results",
      ];

      const schemaValidation = await this.validateTableSchemas(requiredTables, supabase);

      // 3. Run database consistency checks
      const { data: consistencyIssues, error: consistencyError } =
        await supabase.rpc("validate_database_consistency");

      if (consistencyError) {
        console.warn(
          "Could not run consistency validation function:",
          consistencyError,
        );
      }

      // 4. Test critical queries
      const queryTests = await this.testCriticalQueries(supabase);

      // 5. Run direct data validation checks
      const dataValidationIssues = await this.validateDataIntegrity(supabase);

      // 5. Normalize consistency issues to match ValidationResult interface
      const normalizedConsistencyIssues: ValidationResult[] = [];
      if (consistencyIssues && Array.isArray(consistencyIssues)) {
        for (const issue of consistencyIssues) {
          normalizedConsistencyIssues.push({
            tableName: issue.table_name || 'unknown',
            issueType: issue.issue_type || 'unknown',
            issueCount: Number(issue.issue_count) || 0,
            details: issue.details || 'No details available'
          });
        }
      }

      // 7. Compile results
      const allIssues: ValidationResult[] = [
        ...schemaValidation,
        ...normalizedConsistencyIssues,
        ...queryTests,
        ...dataValidationIssues,
      ];

      const totalIssues = allIssues.reduce(
        (sum, issue) => sum + (Number(issue.issueCount) || 0),
        0,
      );
      const isValid = totalIssues === 0;

      const summary = isValid
        ? "✅ Database schema validation passed - no issues found"
        : `❌ Found ${totalIssues} issues across ${allIssues.length} categories`;

      console.log(summary);

      return {
        isValid,
        issues: allIssues,
        summary,
      };
    } catch (error) {
      console.error("❌ Schema validation failed:", error);
      return {
        isValid: false,
        issues: [
          {
            tableName: "system",
            issueType: "validation_error",
            issueCount: 1,
            details:
              error instanceof Error
                ? error.message
                : "Unknown validation error",
          },
        ],
        summary: "❌ Schema validation could not complete due to errors",
      };
    }
  }

  private static async validateTableSchemas(
    requiredTables: string[],
    supabase: ReturnType<typeof this.getSupabaseClient>,
  ): Promise<ValidationResult[]> {
    const issues: ValidationResult[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table as any)
          .select("*")
          .limit(0);

        if (error) {
          issues.push({
            tableName: table,
            issueType: "table_missing_or_inaccessible",
            issueCount: 1,
            details: `Table ${table} is not accessible: ${error.message}`,
          });
        }
      } catch (error) {
        issues.push({
          tableName: table,
          issueType: "table_error",
          issueCount: 1,
          details: `Error testing table ${table}: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return issues;
  }

  private static async testCriticalQueries(
    supabase: ReturnType<typeof this.getSupabaseClient>,
  ): Promise<ValidationResult[]> {
    const issues: ValidationResult[] = [];

    // Test medications query
    try {
      const { error: medError } = await supabase
        .from("medications")
        .select("id, name, fda_category, fda_category_ai, llm_safety_analysis")
        .limit(1);

      if (medError) {
        issues.push({
          tableName: "medications",
          issueType: "query_error",
          issueCount: 1,
          details: `Medications query failed: ${medError.message}`,
        });
      }
    } catch (error) {
      issues.push({
        tableName: "medications",
        issueType: "query_exception",
        issueCount: 1,
        details: `Medications query exception: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test pregnancy query with joins
    try {
      const { error: pregError } = await supabase
        .from("pregnancies")
        .select(
          `
          *,
          medications(id, name, fda_category),
          symptoms(id, type, severity)
        `,
        )
        .eq("is_active", true)
        .limit(1);

      if (pregError) {
        issues.push({
          tableName: "pregnancies",
          issueType: "join_query_error",
          issueCount: 1,
          details: `Pregnancy join query failed: ${pregError.message}`,
        });
      }
    } catch (error) {
      issues.push({
        tableName: "pregnancies",
        issueType: "join_query_exception",
        issueCount: 1,
        details: `Pregnancy join query exception: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    return issues;
  }

  private static async validateDataIntegrity(
    supabase: ReturnType<typeof this.getSupabaseClient>,
  ): Promise<ValidationResult[]> {
    const issues: ValidationResult[] = [];

    try {
      // Check for medications with invalid FDA categories
      const { data: invalidMeds, error: medError } = await supabase
        .from("medications")
        .select("id")
        .not("fda_category", "in", "(A,B,C,D,X)");

      if (medError) {
        issues.push({
          tableName: "medications",
          issueType: "fda_validation_query_error",
          issueCount: 1,
          details: `Could not validate FDA categories: ${medError.message}`,
        });
      } else {
        const invalidCount = invalidMeds?.length || 0;
        if (invalidCount > 0) {
          issues.push({
            tableName: "medications",
            issueType: "invalid_fda_category",
            issueCount: invalidCount,
            details: "Medications with invalid FDA category",
          });
        }
      }

      // Check for pregnancies with future LMP dates
      const { data: futurePregancies, error: pregError } = await supabase
        .from("pregnancies")
        .select("id")
        .gt("last_menstrual_period", new Date().toISOString().split('T')[0]);

      if (pregError) {
        issues.push({
          tableName: "pregnancies",
          issueType: "lmp_validation_query_error",
          issueCount: 1,
          details: `Could not validate LMP dates: ${pregError.message}`,
        });
      } else {
        const futureCount = futurePregancies?.length || 0;
        if (futureCount > 0) {
          issues.push({
            tableName: "pregnancies",
            issueType: "future_dates",
            issueCount: futureCount,
            details: "Pregnancies with future LMP dates",
          });
        }
      }

      // Check for symptoms with invalid severity
      const { data: invalidSymptoms, error: sympError } = await supabase
        .from("symptoms")
        .select("id")
        .or("severity.lt.1,severity.gt.5");

      if (sympError) {
        issues.push({
          tableName: "symptoms",
          issueType: "severity_validation_query_error",
          issueCount: 1,
          details: `Could not validate symptom severity: ${sympError.message}`,
        });
      } else {
        const invalidSeverityCount = invalidSymptoms?.length || 0;
        if (invalidSeverityCount > 0) {
          issues.push({
            tableName: "symptoms",
            issueType: "invalid_severity",
            issueCount: invalidSeverityCount,
            details: "Symptoms with invalid severity (not 1-5)",
          });
        }
      }

      // Check for lab results with invalid trimester
      const { data: invalidLabResults, error: labError } = await supabase
        .from("lab_results")
        .select("id")
        .or("trimester.lt.1,trimester.gt.3");

      if (labError) {
        issues.push({
          tableName: "lab_results",
          issueType: "trimester_validation_query_error",
          issueCount: 1,
          details: `Could not validate trimester values: ${labError.message}`,
        });
      } else {
        const invalidTrimesterCount = invalidLabResults?.length || 0;
        if (invalidTrimesterCount > 0) {
          issues.push({
            tableName: "lab_results",
            issueType: "invalid_trimester",
            issueCount: invalidTrimesterCount,
            details: "Lab results with invalid trimester (not 1-3)",
          });
        }
      }

    } catch (error) {
      issues.push({
        tableName: "system",
        issueType: "data_validation_error",
        issueCount: 1,
        details: `Data validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    return issues;
  }

  static async generateHealthReport(): Promise<string> {
    const validation = await this.validateDatabaseConsistency();

    let report = "# Database Health Report\n\n";
    report += `**Status**: ${validation.isValid ? "✅ HEALTHY" : "❌ ISSUES FOUND"}\n\n`;
    report += `**Summary**: ${validation.summary}\n\n`;

    if (validation.issues.length > 0) {
      report += "## Issues Found\n\n";
      validation.issues.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.tableName} - ${issue.issueType}\n`;
        report += `**Count**: ${issue.issueCount}\n`;
        report += `**Details**: ${issue.details}\n\n`;
      });
    }

    report += `**Generated**: ${new Date().toISOString()}\n`;

    return report;
  }
}

// Run validation if executed directly
if (require.main === module) {
  StandaloneValidator.generateHealthReport()
    .then(console.log)
    .catch(console.error);
}

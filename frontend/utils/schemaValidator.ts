
import { supabase } from './supabase';

interface ValidationResult {
  tableName: string;
  issueType: string;
  issueCount: number;
  details: string;
}

export class SchemaValidator {
  static async validateDatabaseConsistency(): Promise<{
    isValid: boolean;
    issues: ValidationResult[];
    summary: string;
  }> {
    console.log('🔍 Starting comprehensive database schema validation...');
    
    try {
      // 1. Test database connectivity
      const { data: connectTest, error: connectError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (connectError) {
        throw new Error(`Database connectivity failed: ${connectError.message}`);
      }
      
      // 2. Validate all table schemas exist
      const requiredTables = [
        'profiles',
        'pregnancies', 
        'medications',
        'symptoms',
        'lab_reports',
        'lab_results',
        'medication_adherence_logs'
      ];
      
      const schemaValidation = await this.validateTableSchemas(requiredTables);
      
      // 3. Run database consistency checks
      const { data: consistencyIssues, error: consistencyError } = await supabase
        .rpc('validate_database_consistency');
      
      if (consistencyError) {
        console.warn('Could not run consistency validation function:', consistencyError);
      }
      
      // 4. Test critical queries
      const queryTests = await this.testCriticalQueries();
      
      // 5. Compile results
      const allIssues: ValidationResult[] = [
        ...schemaValidation,
        ...(consistencyIssues || []),
        ...queryTests
      ];
      
      const totalIssues = allIssues.reduce((sum, issue) => sum + issue.issueCount, 0);
      const isValid = totalIssues === 0;
      
      const summary = isValid 
        ? '✅ Database schema validation passed - no issues found'
        : `❌ Found ${totalIssues} issues across ${allIssues.length} categories`;
      
      console.log(summary);
      
      return {
        isValid,
        issues: allIssues,
        summary
      };
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      return {
        isValid: false,
        issues: [{
          tableName: 'system',
          issueType: 'validation_error',
          issueCount: 1,
          details: error instanceof Error ? error.message : 'Unknown validation error'
        }],
        summary: '❌ Schema validation could not complete due to errors'
      };
    }
  }
  
  private static async validateTableSchemas(requiredTables: string[]): Promise<ValidationResult[]> {
    const issues: ValidationResult[] = [];
    
    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table as any)
          .select('*')
          .limit(0);
        
        if (error) {
          issues.push({
            tableName: table,
            issueType: 'table_missing_or_inaccessible',
            issueCount: 1,
            details: `Table ${table} is not accessible: ${error.message}`
          });
        }
      } catch (error) {
        issues.push({
          tableName: table,
          issueType: 'table_error',
          issueCount: 1,
          details: `Error testing table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    return issues;
  }
  
  private static async testCriticalQueries(): Promise<ValidationResult[]> {
    const issues: ValidationResult[] = [];
    
    // Test medications query
    try {
      const { error: medError } = await supabase
        .from('medications')
        .select('id, name, fda_category, fda_category_ai, llm_safety_analysis')
        .limit(1);
      
      if (medError) {
        issues.push({
          tableName: 'medications',
          issueType: 'query_error',
          issueCount: 1,
          details: `Medications query failed: ${medError.message}`
        });
      }
    } catch (error) {
      issues.push({
        tableName: 'medications',
        issueType: 'query_exception',
        issueCount: 1,
        details: `Medications query exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    // Test pregnancy query with joins
    try {
      const { error: pregError } = await supabase
        .from('pregnancies')
        .select(`
          *,
          medications(id, name, fda_category),
          symptoms(id, type, severity)
        `)
        .eq('is_active', true)
        .limit(1);
      
      if (pregError) {
        issues.push({
          tableName: 'pregnancies',
          issueType: 'join_query_error', 
          issueCount: 1,
          details: `Pregnancy join query failed: ${pregError.message}`
        });
      }
    } catch (error) {
      issues.push({
        tableName: 'pregnancies',
        issueType: 'join_query_exception',
        issueCount: 1,
        details: `Pregnancy join query exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    return issues;
  }
  
  static async generateHealthReport(): Promise<string> {
    const validation = await this.validateDatabaseConsistency();
    
    let report = '# Database Health Report\n\n';
    report += `**Status**: ${validation.isValid ? '✅ HEALTHY' : '❌ ISSUES FOUND'}\n\n`;
    report += `**Summary**: ${validation.summary}\n\n`;
    
    if (validation.issues.length > 0) {
      report += '## Issues Found\n\n';
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

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).SchemaValidator = SchemaValidator;
  (window as any).generateSchemaReport = SchemaValidator.generateHealthReport;
}

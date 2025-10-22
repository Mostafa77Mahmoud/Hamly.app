
import { createClient } from '@supabase/supabase-js';

export const runSupabaseCheck = async () => {
  // Security: Only run in development mode - never in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Supabase check skipped in production for security');
    return;
  }
  
  console.log('--- Supabase Check Start (Development Only) ---');
  
  try {
    // 1. التحقق من المتغيرات البيئية
    console.log('🔍 Checking environment variables...');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}`);
    console.log(`EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET'}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Environment variables not properly set');
      return;
    }
    
    // 2. إنشاء اتصال Supabase
    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    // 3. فحص اتصال قاعدة البيانات
    console.log('🗄️ Testing database connection...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "profiles" does not exist')) {
          console.log('⚠️ Warning: profiles table does not exist yet');
        } else {
          console.log('❌ Database connection failed:', error.message);
          return;
        }
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (dbError) {
      console.log('⚠️ Warning: Could not test database connection:', dbError);
    }
    
    // 4. إنشاء حساب اختبار جديد
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@gmail.com`;
    const testPassword = 'Password123!';
    
    console.log('📝 Testing user signup...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.log('❌ SignUp failed:', signUpError.message);
      return;
    } else {
      console.log(`✅ SignUp success with email: ${testEmail}`);
    }
    
    // انتظار قليل قبل محاولة تسجيل الدخول
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. تسجيل الدخول بالحساب الجديد
    console.log('🔐 Testing user signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.log('❌ SignIn failed:', signInError.message);
    } else {
      const accessToken = signInData.session?.access_token;
      if (accessToken) {
        console.log(`✅ SignIn success - Token: ${accessToken.substring(0, 20)}...`);
      } else {
        console.log('✅ SignIn success but no access token received');
      }
    }
    
    // تنظيف - تسجيل خروج
    await supabase.auth.signOut();
    console.log('🧹 Cleaned up test session');
    
  } catch (error) {
    console.log('❌ Unexpected error during Supabase check:', error);
  }
  
  console.log('--- Supabase Check End ---');
};
export async function checkSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { supabase } = await import('./supabase');
    
    // Test 1: Basic connection
    const start = Date.now();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const sessionTime = Date.now() - start;
    
    console.log(`✅ Session check: ${sessionTime}ms`, {
      hasSession: !!session,
      userEmail: session?.user?.email,
      error: sessionError
    });
    
    if (!session?.user) {
      console.warn('⚠️ No authenticated user found');
      return { success: false, issue: 'No authenticated user' };
    }
    
    // Test 2: Database query
    const queryStart = Date.now();
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', session.user.id)
      .single();
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Profile query: ${queryTime}ms`, {
      hasProfile: !!profileData,
      error: profileError
    });
    
    // Test 3: Pregnancy data
    const pregStart = Date.now();
    const { data: pregnancyData, error: pregnancyError } = await supabase
      .from('pregnancies')
      .select('id, name, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .limit(1);
    const pregTime = Date.now() - pregStart;
    
    console.log(`✅ Pregnancy query: ${pregTime}ms`, {
      hasActivePregnancy: !!pregnancyData?.length,
      error: pregnancyError
    });
    
    return {
      success: true,
      timings: {
        session: sessionTime,
        profile: queryTime,
        pregnancy: pregTime
      },
      data: {
        userEmail: session.user.email,
        hasProfile: !!profileData,
        hasActivePregnancy: !!pregnancyData?.length
      }
    };
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      success: false,
      issue: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

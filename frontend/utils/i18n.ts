import { I18nManager } from 'react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Translations {
  // Navigation
  labResults: string;
  medications: string;
  healthCheck: string;
  voiceCompanion: string;
  profile: string;

  // Common
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  add: string;
  loading: string;
  error: string;
  success: string;
  ok: string;
  required: string;
  optional: string;
  info: string;
  permissionRequired: string;
  cameraPermissionNeeded: string;
  fileTooLarge: string;
  failedToTakePhoto: string;
  failedToSelectImage: string;
  failedToSelectDocument: string;
  analyzingDocument: string;
  processingComplete: string;
  aiAnalyzingLabReport: string;
  processingTimeNote: string;
  failedToExtractLabData: string;
  rateLimitExceeded: string;
  processingTimeout: string;
  failedToParseAIResponse: string;
  noValidLabResults: string;
  noContentFromAI: string;
  failedToProcessDocument: string;

  // Lab Results
  labResultsTitle: string;
  labResultsSubtitle: string;
  uploadLabReport: string;
  addManually: string;
  noLabReports: string;
  noLabReportsSubtext: string;
  takePhoto: string;
  chooseImage: string;
  uploadPDF: string;
  takePhotoDesc: string;
  chooseImageDesc: string;
  uploadPDFDesc: string;
  uploadSubtitle: string;
  extractionTips: string;
  tip1: string;
  tip2: string;
  tip3: string;
  tip4: string;
  tip5: string;
  tip6: string;
  extractingLabData: string;
  aiExtractionDisclaimer: string;
  addLabResult: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  date: string;
  notes: string;
  addResult: string;
  tests: string;
  testsAbnormal: string;
  abnormal: string;
  normal: string;
  source: string;
  requiresAttention: string;
  errorLoadingReport: string;
  uploadedDocument: string;
  manualEntry: string;
  reportSummary: string;
  totalTests: string;
  testResults: string;
  abnormalAlert: string;
  reportSummaryTitle: string;
  normalResult: string;
  abnormalResult: string;
  sourceLabel: string;
  testResultsTitle: string;
  whatThisMeans: string;
  resultsOutsideNormalRange: string;
  reportNotFound: string;
  noReportsFound: string;
  failedToLoadReport: string;
  loadingReport: string;
  backToReports: string;

  // Extracted Data Review
  reviewExtractedData: string;
  aiAnalysisSummary: string;
  reportDate: string;
  reportDateDescription: string;
  extractedTestResults: string;
  reviewAndEdit: string;
  editingTestResult: string;
  removeTest: string;
  removeTestConfirm: string;
  removeTestMessage: string;
  explanationAbnormal: string;
  saveResults: string;
  referencePrefix: string;

  // Medications
  medicationsTitle: string;
  medicationsSubtitle: string;
  noMedications: string;
  noMedicationsSubtext: string;
  addMedication: string;
  unknownMedication: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  safetyCategory: string;
  fdaCategory: string;
  prescribed: string;
  todaysDose: string;
  taken: string;
  markAsTaken: string;
  aiSafetyAnalysis: string;
  safetyAssessment: string;
  benefits: string;
  risksMonitoring: string;
  aiAnalysisDisclaimer: string;
  analyzingMedication: string;
  analyzingMedicationSubtext: string;
  medicationAdded: string;
  medicationAddedDesc: string;
  medicationSafetyFailed: string;
  profileRequiredMedication: string;
  aiAnalysisInfo: string;

  // Health Check
  healthCheckTitle: string;
  healthCheckSubtitle: string;
  logSymptom: string;
  logSymptomDesc: string;
  recentSymptoms: string;
  noSymptoms: string;
  noSymptomsSubtext: string;
  symptomType: string;
  severityLevel: string;
  description: string;
  possibleTriggers: string;
  triggers: string;
  mild: string;
  severe: string;
  light: string;
  moderate: string;
  verySevere: string;
  unknown: string;
  recommendations: string;
  aiAnalysis: string;
  analyzingSymptom: string;
  analyzingSymptomSubtext: string;
  symptomAnalyzed: string;
  symptomAnalyzedDesc: string;
  symptomLogged: string;
  profileRequiredSymptom: string;
  aiSymptomInfo: string;
  analysisFailed: string;
  saveFailed: string;
  symptomAdded: string;
  loadingData: string;
  healthTitle: string;
  healthSubtitle: string;
  noSymptomsLogged: string;
  addSymptom: string;
  analysis: string;

  // Profile
  profileTitle: string;
  profileSubtitle: string;
  pregnancyJourney: string;
  due: string;
  weeks: string;
  days: string;
  pregnancyProgress: string;
  daysToGo: string;
  overdue: string;
  trimester1: string;
  trimester2: string;
  trimester3: string;
  pregnancyDetails: string;
  currentWeek: string;
  currentTrimester: string;
  lastMenstrualPeriod: string;
  dueDate: string;
  editProfile: string;
  name: string;
  lmp: string;
  dueDateCalculation: string;
  saveChanges: string;
  consultDisclaimer: string;

  // Pregnancy Management
  selectPregnancy: string;
  noActivePregnancy: string;
  managePregnancies: string;
  existingPregnancies: string;
  addNewPregnancy: string;
  pregnancyName: string;
  pregnancyNamePlaceholder: string;
  pregnancyNotesPlaceholder: string;
  addPregnancy: string;
  active: string;
  editPregnancy: string;
  addFirstPregnancy: string;
  trimester: string;

  // Safety Categories
  noRecommendations: string;
  safetyA: string;
  safetyB: string;
  safetyC: string;
  safetyD: string;
  safetyX: string;
  safetyADesc: string;
  safetyBDesc: string;
  safetyyCDesc: string;
  safetyDDesc: string;
  safetyXDesc: string;

  // Placeholders
  symptomTypePlaceholder: string;
  descriptionPlaceholder: string;
  triggersPlaceholder: string;
  medicationNamePlaceholder: string;
  dosagePlaceholder: string;
  frequencyPlaceholder: string;
  notesPlaceholder: string;
  testNamePlaceholder: string;
  valuePlaceholder: string;
  unitPlaceholder: string;
  referencePlaceholder: string;
  namePlaceholder: string;

  // Voice Companion
  voiceCompanionTitle: string;
  voiceCompanionSubtitle: string;
  weeklyUpdates: string;
  voiceSettings: string;
  notificationSettings: string;
  enableWeeklyNotifications: string;
  notificationTime: string;
  voiceSpeed: string;
  voiceSelection: string;
  playThisWeek: string;
  playLastWeek: string;
  savedNotifications: string;
  noSavedNotifications: string;
  currentWeekUpdate: string;
  weeklyUpdateFor: string;
  fetalDevelopment: string;
  maternalChanges: string;
  healthTips: string;
  nutritionAdvice: string;
  generatingVoice: string;
  playingVoice: string;
  voiceGenerated: string;
  voiceGenerationFailed: string;
  saveNotification: string;
  notificationSaved: string;
  deleteNotification: string;
  confirmDelete: string;
  deleteMessage: string;
  voiceNotificationsEnabled: string;
  voiceNotificationsDisabled: string;
  selectVoice: string;
  testVoice: string;
  voicePreview: string;

  // Additional translations for improved UX
  addNewSymptom: string;
  enterSymptom: string;
  pleaseEnterSymptom: string;
  failedToAddSymptom: string;
  analyzing: string;
  severity: string;
  medicalAnalysis: string;
  trackSymptomsWithAI: string;
  manageMedicationsWithAI: string;
  startTrackingMedications: string;
  addNewMedication: string;
  enterMedicationName: string;
  enterDosage: string;
  enterFrequency: string;
  pleaseEnterMedicationName: string;
  failedToAddMedication: string;
  safetyAnalysis: string;
  risks: string;
  overallSafety: string;
  appLogoAlt: string;

  // Onboarding
  onboardingNext: string;
  onboardingSkip: string;
  onboardingGetStarted: string;
  onboardingWelcomeTitle: string;
  onboardingWelcomeSubtitle: string;
  onboardingWelcomeDescription: string;
  onboardingLabsTitle: string;
  onboardingLabsSubtitle: string;
  onboardingLabsDescription: string;
  onboardingMedsTitle: string;
  onboardingMedsSubtitle: string;
  onboardingMedsDescription: string;
  onboardingHealthTitle: string;
  onboardingHealthSubtitle: string;
  onboardingHealthDescription: string;
  onboardingFinalTitle: string;
  onboardingFinalSubtitle: string;
  onboardingFinalDescription: string;
}

const arabicTranslations: Translations = {
  // Navigation
  labResults: 'نتائج التحاليل',
  medications: 'الأدوية',
  healthCheck: 'تتبع الأعراض',
  voiceCompanion: 'المرافق الصوتي',
  profile: 'الملف الشخصي',

  // Common
  cancel: 'إلغاء',
  save: 'حفظ',
  edit: 'تعديل',
  delete: 'حذف',
  add: 'إضافة',
  loading: 'جاري التحميل',
  error: 'حدثت مشكلة',
  success: 'تم',
  ok: 'موافق',
  required: 'مطلوب',
  optional: 'اختياري',
  info: 'معلومات',
  permissionRequired: 'الإذن مطلوب',
  cameraPermissionNeeded: 'إذن الكاميرا مطلوب لالتقاط صور تقارير المختبر',
  fileTooLarge: 'الملف كبير جدًا. يرجى تحميل ملف أقل من 1 ميغابايت',
  failedToTakePhoto: 'فشل في التقاط الصورة. حاول مرة أخرى',
  failedToSelectImage: 'فشل في اختيار الصورة. حاول مرة أخرى',
  failedToSelectDocument: 'فشل في اختيار الوثيقة. حاول مرة أخرى',
  analyzingDocument: 'تحليل الوثيقة...',
  processingComplete: 'اكتمل المعالجة!',
  aiAnalyzingLabReport: 'الذكاء الاصطناعي يحلل تقرير المختبر الخاص بك...',
  processingTimeNote: 'قد يستغرق هذا 10-30 ثانية حسب تعقيد الوثيقة',
  failedToExtractLabData: 'تعذر استخراج بيانات المختبر من الوثيقة. تأكد من وضوح الوثيقة وأنها تحتوي على نتائج اختبارات المختبر، أو حاول إدخال البيانات يدويًا',
  rateLimitExceeded: 'تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار قليلاً وحاول مرة أخرى',
  processingTimeout: 'استغرقت المعالجة وقتًا طويلاً. حاول تحميل ملف أصغر',
  failedToParseAIResponse: 'فشل في تحليل استجابة الذكاء الاصطناعي',
  noValidLabResults: 'لم يتم العثور على نتائج تحاليل صالحة في الوثيقة',
  noContentFromAI: 'لم يتم الحصول على محتوى من الذكاء الاصطناعي',
  failedToProcessDocument: 'فشل في معالجة الوثيقة',

  // Lab Results
  labResultsTitle: 'نتائج التحاليل',
  labResultsSubtitle: 'تحليل وفهم نتائج التحاليل أثناء الحمل',
  uploadLabReport: 'رفع نتيجة التحليل',
  addManually: 'إضافة تحليل يدوياً',
  noLabReports: 'لا توجد تقارير مختبر بعد',
  noLabReportsSubtext: 'ارفع التحاليل الطبية للحصول على شرح طبي للنتائج والمقترحات',
  takePhoto: 'التقاط صورة',
  chooseImage: 'اختيار صورة',
  uploadPDF: 'رفع ملف PDF',
  takePhotoDesc: 'استخدم الكاميرا لالتقاط نتيجة التحليل',
  chooseImageDesc: 'اختر صورة (JPG, PNG) من مكتبة الصور',
  uploadPDFDesc: 'اختر ملف PDF لنتيجة التحليل',
  uploadSubtitle: 'التقط صورة أو ارفع نتيجة التحليل (PDF أو صورة) لاستخراج النتائج تلقائياً باستخدام الذكاء الاصطناعي',
  extractionTips: '💡 نصائح لأفضل نتيجة:',
  tip1: '• تأكد من الإضاءة الجيدة و وضوح النص ',
  tip2: '• قم بتضمين التقرير كاملاً مع أسماء الفحوصات والقيم',
  tip3: '• تجنب الظلال أو الوهج أو الصور الضبابية',
  tip4: '• حافظ على الوثيقة مسطحة وموجهة بشكل صحيح',
  tip5: '• بالنسبة لملفات PDF، تأكد من احتوائها على نص فعلي (وليس مجرد صور ممسوحة ضوئياً)',
  tip6: '• الوثائق أحادية الصفحة ومتعددة الصفحات مدعومة',
  extractingLabData: 'استخراج بيانات التحليل بالذكاء الاصطناعي',
  aiExtractionDisclaimer: '⚠️ استخراج الذكاء الاصطناعي أداة مفيدة لكنها قد لا تكون دقيقة 100%. راجع دائماً البيانات المستخرجة وتحقق منها قبل الحفظ.',
  addLabResult: 'إضافة نتيجة تحليل',
  testName: 'اسم الفحص',
  value: 'القيمة',
  unit: 'الوحدة',
  referenceRange: 'المدى المرجعي',
  date: 'التاريخ',
  notes: 'ملاحظات',
  addResult: 'إضافة النتيجة',
  tests: 'فحوصات',
  testsAbnormal: 'فحوصات (غير طبيعية)',
  abnormal: 'غير طبيعي',
  normal: 'طبيعي',
  source: 'المصدر',
  requiresAttention: 'تتطلب اهتماماً',
  errorLoadingReport: 'خطأ في تحميل التقرير',
  uploadedDocument: 'ملف مرفوع',
  manualEntry: 'إدخال يدوي',
  reportSummary: 'ملخص التقرير',
  totalTests: 'إجمالي الفحوصات',
  testResults: 'نتائج الفحوصات',
  abnormalAlert: 'نتيجة غير طبيعية',
  reportSummaryTitle: 'ملخص التقرير',
  normalResult: 'طبيعي',
  abnormalResult: 'غير طبيعي',
  sourceLabel: 'المصدر:',
  testResultsTitle: 'نتائج الفحوصات',
  whatThisMeans: 'ما يعنيه هذا:',
  resultsOutsideNormalRange: 'نتائج خارج المدى الطبيعي',
  reportNotFound: 'لم يتم العثور على التقرير',
  noReportsFound: 'لم يتم العثور على تقارير',
  failedToLoadReport: 'فشل في تحميل التقرير',
  loadingReport: 'جاري تحميل التقرير',
  backToReports: 'العودة إلى التقارير',

  // Extracted Data Review
  reviewExtractedData: 'مراجعة البيانات المستخرجة',
  aiAnalysisSummary: 'ملخص التحليل بالذكاء الاصطناعي',
  reportDate: 'تاريخ التقرير',
  reportDateDescription: 'تم استخراج هذا التاريخ من تقرير المختبر ولا يمكن تعديله. جميع نتائج الفحوصات ستستخدم هذا التاريخ.',
  extractedTestResults: 'نتائج الفحوصات المستخرجة',
  reviewAndEdit: 'راجع وعدل البيانات المستخرجة قبل الحفظ',
  editingTestResult: 'تعديل نتيجة الفحص',
  removeTest: 'إزالة الفحص',
  removeTestConfirm: 'إزالة الفحص',
  removeTestMessage: 'هل أنت متأكد من أنك تريد إزالة نتيجة هذا الفحص؟',
  explanationAbnormal: 'شرح (للنتائج غير الطبيعية)',
  saveResults: 'حفظ',
  referencePrefix: 'المرجع:',

  // Medications
  medicationsTitle: 'الأدوية',
  medicationsSubtitle: 'تتبع الأدوية وأمانها أثناء الحمل ',
  noMedications: 'لا توجد أدوية متتبعة',
  noMedicationsSubtext: 'أضف اسم الدواء لتحصل على تحليل لأمان استخدامه أثناء الحمل ومدى أهميته لحالتك الصحية',
  addMedication: 'إضافة دواء',
  unknownMedication: 'دواء غير معروف',
  medicationName: 'اسم الدواء',
  dosage: 'الجرعة',
  frequency: 'التكرار',
  safetyCategory: 'فئة الأمان',
  fdaCategory: 'درجة الأمان',
  prescribed: 'موصوف',
  todaysDose: 'جرعة اليوم',
  taken: 'تم تناوله',
  markAsTaken: 'تم تناوله',
  aiSafetyAnalysis: 'تحليل الأمان ',
  safetyAssessment: 'تقييم الأمان',
  benefits: 'الفوائد',
  risksMonitoring: 'المخاطر والمراقبة',
  aiAnalysisDisclaimer: '⚠️ هذا التحليل بالذكاء الاصطناعي لأغراض معلوماتية فقط. استشر دائماً مقدم الرعاية الصحية للحصول على المشورة الطبية.',
  analyzingMedication: 'تحليل أمان الدواء',
  analyzingMedicationSubtext: ' المساعد الطبي يبحث في أمان هذا الدواء أثناء الحمل...',
  medicationAdded: 'تم إضافة الدواء',
  medicationAddedDesc: 'تم إضافة الدواء مع تحليل الأمان. يرجى مراجعة معلومات الأمان واستشارة مقدم الرعاية الصحية دائماً.',
  medicationSafetyFailed: 'تم إضافة الدواء، لكن تحليل الأمان فشل. يرجى استشارة مقدم الرعاية الصحية للحصول على معلومات الأمان.',
  profileRequiredMedication: 'معلومات الملف الشخصي مطلوبة لتحليل الأمان للدواء بدقة. يرجى إعداد ملفك الشخصي أولاً.',
  aiAnalysisInfo: 'سيحلل المساعد الطبي أمان هذا الدواء أثناء حملك بناءً على أسبوعك الحالي ونتائج التحاليل الحديثة.',

  // Health Check
  healthCheckTitle: 'تتبع الأعراض',
  healthCheckSubtitle: 'تتبع الأعراض مع الذكاء الاصطناعي',
  logSymptom: 'تسجيل عرض',
  logSymptomDesc: 'احصل على تقييم صحي',
  recentSymptoms: 'الأعراض الحديثة',
  noSymptoms: 'لم يتم تسجيل أعراض بعد',
  noSymptomsSubtext: 'ابدأ بتتبع أعراضك للحصول على رؤى صحية ',
  symptomType: 'نوع العرض',
  severityLevel: 'مستوى الشدة',
  description: 'الوصف',
  possibleTriggers: 'المحفزات المحتملة',
  triggers: 'المحفزات',
  mild: 'خفيف',
  severe: 'شديد',
  light: 'خفيف',
  moderate: 'متوسط',
  verySevere: 'شديد جداً',
  unknown: 'غير معروف',
  recommendations: 'التوصيات',
  aiAnalysis: 'التحليل الطبي',
  analyzingSymptom: 'تحليل العرض',
  analyzingSymptomSubtext: 'المساعد الطبي يحلل عرضك مع مراعاة تحاليلك الطبية والأدوية الموصوفة واسبوع الحمل الحالي...',
  symptomAnalyzed: 'تم تحليل العرض',
  symptomAnalyzedDesc: 'تم تسجيل عرضك مع التحليل. يرجى مراجعة التوصيات واستشارة مقدم الرعاية الصحية دائماً.',
  symptomLogged: 'تم تسجيل العرض',
  profileRequiredSymptom: 'معلومات ملفك الشخصي مطلوبة للتحليل بدقة. يرجى إعداد ملفك الشخصي في تبويب الملف الشخصي أولاً.',
  aiSymptomInfo: 'سيحلل المساعد الطبي هذا العرض مع مراعاة أسبوع حملك والأدوية الحالية ونتائج التحاليل الحديثة لتقديم رؤى صحية شخصية.',
  analysisFailed: 'فشل في التحليل',
  saveFailed: 'فشل في الحفظ',
  symptomAdded: 'تم إضافة العرض',
  loadingData: 'جاري تحميل البيانات',
  healthTitle: 'تتبع الأعراض',
  healthSubtitle: 'تتبع الأعراض مع الذكاء الاصطناعي',
  noSymptomsLogged: 'لم يتم تسجيل أعراض بعد',
  addSymptom: 'إضافة عرض',
  analysis: 'التحليل',

  // Profile
  profileTitle: 'الملف الشخصي',
  profileSubtitle: 'رحلة حملك الحالي',
  pregnancyJourney: 'رحلة الحمل',
  due: 'موعد الولادة المتوقع',
  weeks: 'أسابيع',
  days: 'أيام',
  pregnancyProgress: 'مدى تقدم الحمل',
  daysToGo: 'يوم متبقي',
  overdue: 'متأخر',
  trimester1: 'الأول',
  trimester2: 'الثاني',
  trimester3: 'الثالث',
  pregnancyDetails: 'تفاصيل الحمل',
  currentWeek: 'الأسبوع الحالي',
  currentTrimester: 'الثلث الحالي',
  lastMenstrualPeriod: 'آخر دورة شهرية',
  dueDate: 'تاريخ الولادة المتوقع',
  editProfile: 'تعديل الملف الشخصي',
  name: 'الاسم',
  lmp: 'بداية آخر دورة شهرية',
  dueDateCalculation: 'سيتم حساب تاريخ الولادة المتوقع تلقائياً بناءً على آخر دورة شهرية (آخر دورة شهرية + 280 يوم)',
  saveChanges: 'حفظ التغييرات',
  consultDisclaimer: 'استشر دائماً مقدم الرعاية الصحية للحصول على المشورة الطبية',

  // Pregnancy Management
  selectPregnancy: 'اختيار الحمل',
  noActivePregnancy: 'لا يوجد حمل نشط',
  managePregnancies: 'إدارة الحمل',
  existingPregnancies: 'الحمل الحالي',
  addNewPregnancy: 'إضافة حمل جديد',
  pregnancyName: 'اسم الحمل',
  pregnancyNamePlaceholder: 'مثل: الحمل الأول، حمل 2024',
  pregnancyNotesPlaceholder: 'ملاحظات إضافية (اختياري)',
  addPregnancy: 'إضافة حمل',
  active: 'نشط',
  editPregnancy: 'تعديل الحمل',
  addFirstPregnancy: 'اضغط على الزر أعلاه لإضافة حملك الأول وبدء تتبع رحلتك',
  trimester: 'الثلث',

  // Safety Categories
  noRecommendations: 'لا توجد توصيات متاحة',
  safetyA: 'آمن',
  safetyB: 'آمن على الأرجح',
  safetyC: 'استخدم بحذر',
  safetyD: 'استخدم فقط إذا كانت الفوائد تفوق المخاطر',
  safetyX: 'ممنوع',
  safetyADesc: 'دراسات كافية ومضبوطة جيداً فشلت في إثبات خطر على الجنين.',
  safetyBDesc: 'دراسات الحيوانات لم تكشف عن دليل على ضرر للجنين.',
  safetyyCDesc: 'دراسات الحيوانات أظهرت آثاراً ضارة، لكن لا توجد دراسات بشرية كافية.',
  safetyDDesc: 'دليل على خطر الجنين البشري، لكن الفوائد قد تبرر الاستخدام رغم المخاطر المحتملة.',
  safetyXDesc: 'الدراسات أظهرت تشوهات جنينية. المخاطر تفوق الفوائد بوضوح.',

  // Placeholders
  symptomTypePlaceholder: 'مثل: غثيان، صداع، ألم الظهر',
  descriptionPlaceholder: 'صف العرض بالتفصيل (اختياري)',
  triggersPlaceholder: 'طعام، نشاط، توتر، إلخ',
  medicationNamePlaceholder: 'مثل: فيتامينات ما قبل الولادة، حمض الفوليك',
  dosagePlaceholder: 'مثل: قرص واحد، 400 ملغ',
  frequencyPlaceholder: 'مثل: مرة يومياً، مرتين يومياً',
  notesPlaceholder: 'آثار جانبية، تعليمات، إلخ',
  testNamePlaceholder: 'مثل: الهيموجلوبين، الجلوكوز',
  valuePlaceholder: '12.5',
  unitPlaceholder: 'غ/دل',
  referencePlaceholder: '11.0 - 15.0',
  namePlaceholder: 'أدخل اسمك',

  // Voice Companion
  voiceCompanionTitle: 'المرافق الصوتي الأسبوعي',
  voiceCompanionSubtitle: 'تحديثات صوتية شخصية لرحلة حملك',
  weeklyUpdates: 'التحديثات الأسبوعية',
  voiceSettings: 'إعدادات الصوت',
  notificationSettings: 'إعدادات الإشعارات',
  enableWeeklyNotifications: 'تفعيل الإشعارات الأسبوعية',
  notificationTime: 'وقت الإشعار',
  voiceSpeed: 'سرعة الصوت',
  voiceSelection: 'اختيار الصوت',
  playThisWeek: 'تشغيل هذا الأسبوع',
  playLastWeek: 'تشغيل الأسبوع الماضي',
  savedNotifications: 'الإشعارات المحفوظة',
  noSavedNotifications: 'لا توجد إشعارات محفوظة',
  currentWeekUpdate: 'تحديث الأسبوع الحالي',
  weeklyUpdateFor: 'التحديث الأسبوعي للأسبوع',
  fetalDevelopment: 'تطور الجنين',
  maternalChanges: 'التغيرات الأمومية',
  healthTips: 'نصائح صحية',
  nutritionAdvice: 'نصائح التغذية',
  generatingVoice: 'جاري إنشاء الصوت...',
  playingVoice: 'جاري التشغيل...',
  voiceGenerated: 'تم إنشاء الصوت بنجاح',
  voiceGenerationFailed: 'فشل في إنشاء الصوت',
  saveNotification: 'حفظ الإشعار',
  notificationSaved: 'تم حفظ الإشعار',
  deleteNotification: 'حذف الإشعار',
  confirmDelete: 'تأكيد الحذف',
  deleteMessage: 'هل أنت متأكد من حذف هذا الإشعار؟',
  voiceNotificationsEnabled: 'تم تفعيل الإشعارات الصوتية',
  voiceNotificationsDisabled: 'تم إلغاء تفعيل الإشعارات الصوتية',
  selectVoice: 'اختيار الصوت',
  testVoice: 'اختبار الصوت',
  voicePreview: 'معاينة الصوت',

  // Additional translations for improved UX
  addNewSymptom: 'إضافة عرض جديد',
  enterSymptom: 'أدخل وصف العرض',
  pleaseEnterSymptom: 'يرجى إدخال وصف العرض',
  failedToAddSymptom: 'فشل في إضافة العرض',
  analyzing: 'جاري التحليل...',
  severity: 'شدة العرض',
  medicalAnalysis: 'التحليل الطبي',
  trackSymptomsWithAI: 'تتبع الأعراض مع التحليل بالذكاء الاصطناعي',
  manageMedicationsWithAI: 'إدارة الأدوية مع تحليل الأمان بالذكاء الاصطناعي',
  startTrackingMedications: 'ابدأ بتتبع أدويتك للحصول على رؤى الأمان',
  addNewMedication: 'إضافة دواء جديد',
  enterMedicationName: 'أدخل اسم الدواء',
  enterDosage: 'أدخل الجرعة (مثل: 500 ملغ)',
  enterFrequency: 'أدخل التكرار (مثل: مرتين يومياً)',
  pleaseEnterMedicationName: 'يرجى إدخال اسم الدواء',
  failedToAddMedication: 'فشل في إضافة الدواء',
  safetyAnalysis: 'تحليل الأمان',
  risks: 'المخاطر',
  overallSafety: 'الأمان العام',
  appLogoAlt: 'شعار HamlyMD',

  // Onboarding - Welcome Screen (1/5)
  onboardingNext: 'التالي',
  onboardingSkip: 'تخطي',
  onboardingGetStarted: 'ابدأ الآن',
  onboardingWelcomeTitle: 'مرحباً بك في HamlyMD',
  onboardingWelcomeSubtitle: 'رفيقتك الموثوقة طوال رحلة حملك',
  onboardingWelcomeDescription: 'تطبيق شامل مصمم خصيصاً لمساعدتك في كل مرحلة من مراحل الحمل بمعلومات طبية موثوقة ورعاية شخصية',

  // Onboarding - Lab Results Screen (2/5)
  onboardingLabsTitle: 'تحليل ذكي لنتائج المختبر',
  onboardingLabsSubtitle: 'افهمي فحوصاتك الطبية بسهولة',
  onboardingLabsDescription: 'تحميل نتائج الفحوصات والحصول على شرح مفصل وسهل الفهم بالذكاء الاصطناعي للاطمئنان على صحتك وصحة جنينك',

  // Onboarding - Medications Screen (3/5)
  onboardingMedsTitle: 'سلامة الأدوية أثناء الحمل',
  onboardingMedsSubtitle: 'تحققي من أمان أدويتك',
  onboardingMedsDescription: 'احصلي على تقييم فوري لسلامة أي دواء أثناء الحمل مع توصيات طبية معتمدة لحمايتك أنت وجنينك',

  // Onboarding - Health Tracking Screen (4/5)
  onboardingHealthTitle: 'تتبع شامل للصحة والأعراض',
  onboardingHealthSubtitle: 'راقبي تطور حملك يومياً',
  onboardingHealthDescription: 'سجلي الأعراض، الوزن، ضغط الدم وغيرها، واحصلي على تحليلات ذكية ونصائح صحية مخصصة لحالتك',

  // Onboarding - Get Started Screen (5/5)
  onboardingFinalTitle: 'ابدأي رحلتك الآن!',
  onboardingFinalSubtitle: 'كل ما تحتاجينه في مكان واحد',
  onboardingFinalDescription: 'انضمي لآلاف الأمهات اللواتي يثقن في HamlyMD لحمل آمن وصحي. ابدأي الآن!',
};

const englishTranslations: Translations = {
  // Navigation
  labResults: 'Lab Results',
  medications: 'Medications',
  healthCheck: 'Health Check',
  voiceCompanion: 'Voice Companion',
  profile: 'Profile',

  // Common
  cancel: 'Cancel',
  save: 'Save',
  edit: 'Edit',
  delete: 'Delete',
  add: 'Add',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  ok: 'OK',
  required: 'Required',
  optional: 'Optional',
  info: 'Information',
  permissionRequired: 'Permission Required',
  cameraPermissionNeeded: 'Camera permission is needed to take photos of lab reports.',
  fileTooLarge: 'File too large. Please upload a file smaller than 1MB.',
  failedToTakePhoto: 'Failed to take photo. Please try again.',
  failedToSelectImage: 'Failed to select image. Please try again.',
  failedToSelectDocument: 'Failed to select document. Please try again.',
  analyzingDocument: 'Analyzing document...',
  processingComplete: 'Processing complete!',
  aiAnalyzingLabReport: 'Our AI is analyzing your lab report...',
  processingTimeNote: 'This may take 10-30 seconds depending on document complexity.',
  failedToExtractLabData: 'Could not extract lab data from the document. Please ensure the document is clear and contains lab test results, or try entering data manually.',
  rateLimitExceeded: 'Too many requests. Please wait a moment and try again.',
  processingTimeout: 'Processing took too long. Please try a smaller file.',
  failedToParseAIResponse: 'Failed to parse AI response',
  noValidLabResults: 'No valid lab results found in document',
  noContentFromAI: 'No content received from AI',
  failedToProcessDocument: 'Failed to process document',

  // Lab Results
  labResultsTitle: 'Lab Results',
  labResultsSubtitle: 'Track your prenatal test results',
  uploadLabReport: 'Upload Lab Report',
  addManually: 'Add Manually',
  noLabReports: 'No lab reports yet',
  noLabReportsSubtext: 'Upload a lab report or add your first result to start tracking your prenatal health',
  takePhoto: 'Take Photo',
  chooseImage: 'Choose Image',
  uploadPDF: 'Upload PDF',
  takePhotoDesc: 'Use your camera to capture the lab report',
  chooseImageDesc: 'Select an image (JPG, PNG) from your photo library',
  uploadPDFDesc: 'Select a PDF file of your lab report',
  uploadSubtitle: 'Take a photo or upload your lab report (PDF or image) to automatically extract test results using AI',
  extractionTips: '💡 Tips for best AI extraction:',
  tip1: '• Ensure good lighting and clear, readable text',
  tip2: '• Include the entire report with test names and values',
  tip3: '• Avoid shadows, glare, or blurry images',
  tip4: '• Keep the document flat and properly oriented',
  tip5: '• For PDFs, ensure they contain actual text (not just scanned images)',
  tip6: '• Both single-page and multi-page documents are supported',
  extractingLabData: 'Extracting lab data with AI',
  aiExtractionDisclaimer: '⚠️ AI extraction is a helpful tool but may not be 100% accurate. Always review and verify the extracted data before saving.',
  addLabResult: 'Add Lab Result',
  testName: 'Test Name',
  value: 'Value',
  unit: 'Unit',
  referenceRange: 'Reference Range',
  date: 'Date',
  notes: 'Notes',
  addResult: 'Add Result',
  tests: 'Tests',
  testsAbnormal: 'Tests (Abnormal)',
  abnormal: 'Abnormal',
  normal: 'Normal',
  source: 'Source',
  requiresAttention: 'Requires Attention',
  errorLoadingReport: 'Error loading report',
  uploadedDocument: 'Uploaded Document',
  manualEntry: 'Manual Entry',
  reportSummary: 'Report Summary',
  totalTests: 'Total Tests',
  testResults: 'Test Results',
  abnormalAlert: 'result outside normal range',
  reportSummaryTitle: 'Report Summary',
  normalResult: 'Normal',
  abnormalResult: 'Abnormal',
  sourceLabel: 'Source:',
  testResultsTitle: 'Test Results',
  whatThisMeans: 'What this means:',
  resultsOutsideNormalRange: 'results outside normal range',
  reportNotFound: 'Report not found',
  noReportsFound: 'No reports found',
  failedToLoadReport: 'Failed to load report',
  loadingReport: 'Loading report',
  backToReports: 'Back to Reports',

  // Extracted Data Review
  reviewExtractedData: 'Review Extracted Data',
  aiAnalysisSummary: 'AI Analysis Summary',
  reportDate: 'Report Date',
  reportDateDescription: 'This date was extracted from your lab report and cannot be modified. All test results will use this date.',
  extractedTestResults: 'Extracted Test Results',
  reviewAndEdit: 'Review and edit the extracted data before saving',
  editingTestResult: 'Editing Test Result',
  removeTest: 'Remove Test',
  removeTestConfirm: 'Remove Test',
  removeTestMessage: 'Are you sure you want to remove this test result?',
  explanationAbnormal: 'Explanation (for abnormal results)',
  saveResults: 'Save',
  referencePrefix: 'Reference:',

  // Medications
  medicationsTitle: 'Medications',
  medicationsSubtitle: 'Track your prenatal medications safely',
  noMedications: 'No medications tracked',
  noMedicationsSubtext: 'Add your first medication to start tracking your prenatal care with AI-powered safety analysis',
  addMedication: 'Add Medication',
  unknownMedication: 'Unknown Medication',
  medicationName: 'Medication Name',
  dosage: 'Dosage',
  frequency: 'Frequency',
  safetyCategory: 'Safety Category',
  fdaCategory: 'FDA Category',
  prescribed: 'Prescribed',
  todaysDose: "Today's Dose",
  taken: 'Taken',
  markAsTaken: 'Mark as Taken',
  aiSafetyAnalysis: 'AI Safety Analysis',
  safetyAssessment: 'Safety Assessment',
  benefits: 'Benefits',
  risksMonitoring: 'Risks & Monitoring',
  aiAnalysisDisclaimer: '⚠️ This AI analysis is for informational purposes only. Always consult your healthcare provider for medical advice.',
  analyzingMedication: 'Analyzing Medication Safety',
  analyzingMedicationSubtext: 'Our AI is researching this medication\'s safety during pregnancy...',
  medicationAdded: 'Medication Added',
  medicationAddedDesc: 'Medication has been added with AI safety analysis. Please review the safety information and always consult your healthcare provider.',
  medicationSafetyFailed: 'Medication has been added, but AI safety analysis failed. Please consult your healthcare provider for safety information.',
  profileRequiredMedication: 'Profile information is required for AI safety analysis. Please set up your profile first.',
  aiAnalysisInfo: 'AI will analyze this medication\'s safety during your pregnancy based on your current week and recent lab results.',

  // Health Check
  healthCheckTitle: 'Health Check',
  healthCheckSubtitle: 'Track symptoms with AI-powered analysis',
  logSymptom: 'Log Symptom',
  logSymptomDesc: 'Get AI-powered health assessment',
  recentSymptoms: 'Recent Symptoms',
  noSymptoms: 'No symptoms logged yet',
  noSymptomsSubtext: 'Start tracking your symptoms to get AI-powered health insights',
  symptomType: 'Symptom Type',
  severityLevel: 'Severity Level',
  description: 'Description',
  possibleTriggers: 'Possible Triggers',
  triggers: 'Triggers',
  mild: 'Mild',
  severe: 'Severe',
  light: 'Light',
  moderate: 'Moderate',
  verySevere: 'Very Severe',
  unknown: 'Unknown',
  recommendations: 'Recommendations',
  aiAnalysis: 'AI Analysis',
  analyzingSymptom: 'Analyzing Symptom',
  analyzingSymptomSubtext: 'Our AI is analyzing your symptom considering your pregnancy context...',
  symptomAnalyzed: 'Symptom Analyzed',
  symptomAnalyzedDesc: 'Your symptom has been logged with AI analysis. Please review the recommendations and always consult your healthcare provider.',
  symptomLogged: 'Symptom Logged',
  profileRequiredSymptom: 'Your profile information is required for AI analysis. Please set up your profile in the Profile tab first.',
  aiSymptomInfo: 'AI will analyze this symptom considering your pregnancy week, current medications, and recent lab results to provide personalized health insights.',
  analysisFailed: 'Analysis Failed',
  saveFailed: 'Save Failed',
  symptomAdded: 'Symptom Added',
  loadingData: 'Loading Data',
  healthTitle: 'Health Check',
  healthSubtitle: 'Track symptoms with AI-powered analysis',
  noSymptomsLogged: 'No symptoms logged yet',
  addSymptom: 'Add Symptom',
  analysis: 'Analysis',

  // Profile
  profileTitle: 'Profile',
  profileSubtitle: 'Your pregnancy journey',
  pregnancyJourney: 'Pregnancy Journey',
  due: 'Due',
  weeks: 'weeks',
  days: 'days',
  pregnancyProgress: 'Pregnancy Progress',
  daysToGo: 'days to go',
  overdue: 'Overdue',
  trimester1: '1st',
  trimester2: '2nd',
  trimester3: '3rd',
  pregnancyDetails: 'Pregnancy Details',
  currentWeek: 'Current Week',
  currentTrimester: 'Current Trimester',
  lastMenstrualPeriod: 'Last Menstrual Period',
  dueDate: 'Due Date',
  editProfile: 'Edit Profile',
  name: 'Name',
  lmp: 'Last Menstrual Period (LMP)',
  dueDateCalculation: 'Your due date will be automatically calculated based on your LMP (Last Menstrual Period + 280 days)',
  saveChanges: 'Save Changes',
  consultDisclaimer: 'Always consult with your healthcare provider for medical advice',

  // Pregnancy Management
  selectPregnancy: 'Select Pregnancy',
  noActivePregnancy: 'No active pregnancy',
  managePregnancies: 'Manage Pregnancies',
  existingPregnancies: 'Existing Pregnancies',
  addNewPregnancy: 'Add New Pregnancy',
  pregnancyName: 'Pregnancy Name',
  pregnancyNamePlaceholder: 'e.g., First Pregnancy, Baby #2',
  pregnancyNotesPlaceholder: 'Additional notes (optional)',
  addPregnancy: 'Add Pregnancy',
  active: 'Active',
  editPregnancy: 'Edit Pregnancy',
  addFirstPregnancy: 'Tap the button above to add your first pregnancy and start tracking your journey',
  trimester: 'Trimester',

  // Safety Categories
  noRecommendations: 'No recommendations available',
  safetyA: 'Safe',
  safetyB: 'Probably Safe',
  safetyC: 'Use with Caution',
  safetyD: 'Use Only if Benefits Outweigh Risks',
  safetyX: 'Contraindicated',
  safetyADesc: 'Adequate and well-controlled studies have failed to demonstrate a risk to the fetus.',
  safetyBDesc: 'Animal studies have revealed no evidence of harm to the fetus.',
  safetyyCDesc: 'Animal studies have shown adverse effects, but no adequate human studies.',
  safetyDDesc: 'Evidence of human fetal risk, but benefits may warrant use despite potential risks.',
  safetyXDesc: 'Studies have shown fetal abnormalities. Risks clearly outweigh benefits.',

  // Placeholders
  symptomTypePlaceholder: 'e.g., Nausea, Headache, Back Pain',
  descriptionPlaceholder: 'Describe the symptom in detail (optional)',
  triggersPlaceholder: 'Food, activity, stress, etc.',
  medicationNamePlaceholder: 'e.g., Prenatal Vitamins, Folic Acid',
  dosagePlaceholder: 'e.g., 1 tablet, 400mg',
  frequencyPlaceholder: 'e.g., Once daily, Twice daily',
  notesPlaceholder: 'Side effects, instructions, etc.',
  testNamePlaceholder: 'e.g., Hemoglobin, Glucose',
  valuePlaceholder: '12.5',
  unitPlaceholder: 'g/dL',
  referencePlaceholder: '11.0 - 15.0',
  namePlaceholder: 'Enter your name',

  // Voice Companion
  voiceCompanionTitle: 'Weekly Voice Companion',
  voiceCompanionSubtitle: 'Personalized voice updates for your pregnancy journey',
  weeklyUpdates: 'Weekly Updates',
  voiceSettings: 'Voice Settings',
  notificationSettings: 'Notification Settings',
  enableWeeklyNotifications: 'Enable Weekly Notifications',
  notificationTime: 'Notification Time',
  voiceSpeed: 'Voice Speed',
  voiceSelection: 'Voice Selection',
  playThisWeek: 'Play This Week',
  playLastWeek: 'Play Last Week',
  savedNotifications: 'Saved Notifications',
  noSavedNotifications: 'No saved notifications',
  currentWeekUpdate: 'Current Week Update',
  weeklyUpdateFor: 'Weekly Update for Week',
  fetalDevelopment: 'Fetal Development',
  maternalChanges: 'Maternal Changes',
  healthTips: 'Health Tips',
  nutritionAdvice: 'Nutrition Advice',
  generatingVoice: 'Generating voice...',
  playingVoice: 'Playing...',
  voiceGenerated: 'Voice generated successfully',
  voiceGenerationFailed: 'Failed to generate voice',
  saveNotification: 'Save Notification',
  notificationSaved: 'Notification saved',
  deleteNotification: 'Delete Notification',
  confirmDelete: 'Confirm Delete',
  deleteMessage: 'Are you sure you want to delete this notification?',
  voiceNotificationsEnabled: 'Voice notifications enabled',
  voiceNotificationsDisabled: 'Voice notifications disabled',
  selectVoice: 'Select Voice',
  testVoice: 'Test Voice',
  voicePreview: 'Voice Preview',

  // Additional translations for improved UX
  addNewSymptom: 'Add New Symptom',
  enterSymptom: 'Enter symptom description',
  pleaseEnterSymptom: 'Please enter a symptom description',
  failedToAddSymptom: 'Failed to add symptom',
  analyzing: 'Analyzing...',
  severity: 'Severity',
  medicalAnalysis: 'Medical Analysis',
  trackSymptomsWithAI: 'Track symptoms with AI analysis',
  manageMedicationsWithAI: 'Manage medications with AI safety analysis',
  startTrackingMedications: 'Start tracking your medications to get safety insights.',
  addNewMedication: 'Add New Medication',
  enterMedicationName: 'Enter medication name',
  enterDosage: 'Enter dosage (e.g., 500mg)',
  enterFrequency: 'Enter frequency (e.g., twice daily)',
  pleaseEnterMedicationName: 'Please enter medication name',
  failedToAddMedication: 'Failed to add medication',
  safetyAnalysis: 'Safety Analysis',
  risks: 'Risks',
  overallSafety: 'Overall Safety',
  appLogoAlt: 'HamlyMD Logo',

  // Onboarding - Welcome Screen (1/5)
  onboardingNext: 'Next',
  onboardingSkip: 'Skip',
  onboardingGetStarted: 'Get Started',
  onboardingWelcomeTitle: 'Welcome to Hamly',
  onboardingWelcomeSubtitle: 'Your Smart Health Companion',
  onboardingWelcomeDescription: 'AI-powered personalized healthcare to support you throughout your pregnancy journey. Track your health with confidence and peace of mind',

  // Onboarding - Lab Results Screen (2/5)
  onboardingLabsTitle: 'Understand Lab Results',
  onboardingLabsSubtitle: 'Smart Medical Analysis',
  onboardingLabsDescription: 'Upload a photo or PDF of your lab results, and AI will extract the data and provide detailed medical explanations in simple language',

  // Onboarding - Medications Screen (3/5)
  onboardingMedsTitle: 'Medication Safety',
  onboardingMedsSubtitle: 'Smart Safety Assessment',
  onboardingMedsDescription: 'Track your medications and get instant analysis of their safety during pregnancy with personalized medical recommendations',

  // Onboarding - Health Tracking Screen (4/5)
  onboardingHealthTitle: 'Track Symptoms',
  onboardingHealthSubtitle: 'Smart Health Monitoring',
  onboardingHealthDescription: 'Log daily symptoms and receive instant medical analysis considering your pregnancy week and recent lab results',

  // Onboarding - Get Started Screen (5/5)
  onboardingFinalTitle: 'Everything You Need',
  onboardingFinalSubtitle: 'In One Place',
  onboardingFinalDescription: 'Start a safe and confident pregnancy journey with comprehensive health tracking and AI-powered medical support',
};

// Language state
let currentLanguage: 'ar' | 'en' = 'en';
let currentTranslations: Translations = englishTranslations;
let languageChangeListeners: (() => void)[] = [];

const LANGUAGE_STORAGE_KEY = 'hamly_app_language';

// Save language preference to storage
const saveLanguagePreference = async (language: 'ar' | 'en') => {
  try {
    if (Platform.OS === 'web') {
      // Ensure we're in browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.localStorage) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        // Also set in document for immediate persistence
        document.documentElement.setAttribute('data-language', language);
      }
    } else {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
};

// Load language preference from storage
const loadLanguagePreference = async (): Promise<'ar' | 'en' | null> => {
  try {
    if (Platform.OS === 'web') {
      // First check document attribute (immediate)
      if (typeof document !== 'undefined') {
        const docLang = document.documentElement.getAttribute('data-language');
        if (docLang === 'ar' || docLang === 'en') {
          return docLang;
        }
      }

      // Then check localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY) as 'ar' | 'en' | null;
      }
      return null;
    } else {
      return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY) as 'ar' | 'en' | null;
    }
  } catch (error) {
    console.warn('Failed to load language preference:', error);
    return null;
  }
};

export const setLanguage = async (language: 'ar' | 'en') => {
  currentLanguage = language;
  currentTranslations = language === 'ar' ? arabicTranslations : englishTranslations;

  // Save preference first
  await saveLanguagePreference(language);

  // Set RTL for Arabic (only on native platforms)
  if (Platform.OS !== 'web') {
    I18nManager.forceRTL(language === 'ar');
  } else {
    // For web, set document direction immediately
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language === 'ar' ? 'ar' : 'en';
      document.documentElement.setAttribute('data-language', language);
    }
  }

  // Notify listeners of language change
  languageChangeListeners.forEach(listener => listener());
};

export const addLanguageChangeListener = (listener: () => void) => {
  languageChangeListeners.push(listener);
  return () => {
    languageChangeListeners = languageChangeListeners.filter(l => l !== listener);
  };
};

export const getCurrentLanguage = () => currentLanguage;

export const t = (key: keyof Translations): string => {
  return currentTranslations[key] || key;
};

export const isRTL = () => currentLanguage === 'ar';

// Initialize language with saved preference
export const initializeLanguage = async () => {
  const savedLanguage = await loadLanguagePreference();
  if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
    await setLanguage(savedLanguage);
  } else {
    // Default to Arabic for better user experience
    await setLanguage('ar');
  }
};

// Initialize immediately on load
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Check for immediate language preference
  const docLang = document.documentElement.getAttribute('data-language');
  if (docLang === 'ar' || docLang === 'en') {
    currentLanguage = docLang;
    currentTranslations = docLang === 'ar' ? arabicTranslations : englishTranslations;
    document.documentElement.dir = docLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = docLang === 'ar' ? 'ar' : 'en';
  } else {
    setLanguage('ar'); // Default to Arabic
  }
} else {
  setLanguage('ar'); // Default to Arabic for mobile
}
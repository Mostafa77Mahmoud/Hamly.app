export interface WeeklyContent {
  week: number;
  fetalDevelopment: {
    en: string;
    ar: string;
  };
  maternalChanges: {
    en: string;
    ar: string;
  };
  healthTips: {
    en: string;
    ar: string;
  };
  nutritionAdvice: {
    en: string;
    ar: string;
  };
}

export const pregnancyWeeksData: WeeklyContent[] = [
  {
    week: 1,
    fetalDevelopment: {
      en: "Conception has occurred! The fertilized egg is beginning its journey down the fallopian tube. Your baby is just a cluster of rapidly dividing cells, but this is where the incredible journey begins.",
      ar: "لقد حدث الحمل! البويضة المخصبة تبدأ رحلتها عبر قناة فالوب. طفلك مجرد مجموعة من الخلايا التي تنقسم بسرعة، لكن هذا هو المكان الذي تبدأ فيه الرحلة المذهلة."
    },
    maternalChanges: {
      en: "You may not notice any changes yet, as implantation hasn't occurred. Your body is preparing for the amazing changes ahead. Some women experience light spotting during implantation.",
      ar: "قد لا تلاحظين أي تغييرات بعد، حيث لم يحدث الانغراس بعد. جسمك يستعد للتغييرات المذهلة القادمة. بعض النساء يعانين من نزيف خفيف أثناء الانغراس."
    },
    healthTips: {
      en: "Start taking prenatal vitamins with folic acid if you haven't already. Avoid alcohol, smoking, and limit caffeine. Begin tracking your cycle and symptoms.",
      ar: "ابدئي بتناول فيتامينات ما قبل الولادة مع حمض الفوليك إذا لم تكوني قد فعلت ذلك بالفعل. تجنبي الكحول والتدخين وقللي من الكافيين. ابدئي بتتبع دورتك وأعراضك."
    },
    nutritionAdvice: {
      en: "Focus on a balanced diet rich in folate, iron, and calcium. Include leafy greens, citrus fruits, and whole grains. Stay hydrated with plenty of water.",
      ar: "ركزي على نظام غذائي متوازن غني بحمض الفوليك والحديد والكالسيوم. اشملي الخضروات الورقية والحمضيات والحبوب الكاملة. حافظي على الترطيب بشرب الكثير من الماء."
    }
  },
  {
    week: 2,
    fetalDevelopment: {
      en: "Your baby is still a tiny ball of cells, but important development is happening. The cells are beginning to differentiate and will soon form the foundation for all major organs.",
      ar: "طفلك لا يزال كرة صغيرة من الخلايا، لكن التطور المهم يحدث. الخلايا تبدأ في التمايز وستشكل قريباً الأساس لجميع الأعضاء الرئيسية."
    },
    maternalChanges: {
      en: "You still may not feel pregnant, but your body is working hard. Hormone levels are beginning to change, which may cause subtle mood changes or breast tenderness.",
      ar: "قد لا تشعرين بالحمل بعد، لكن جسمك يعمل بجد. مستويات الهرمونات تبدأ في التغير، مما قد يسبب تغيرات مزاجية خفيفة أو حساسية في الثدي."
    },
    healthTips: {
      en: "Continue with prenatal vitamins and maintain a healthy lifestyle. Schedule a preconception appointment with your healthcare provider if you haven't already.",
      ar: "استمري في تناول فيتامينات ما قبل الولادة والحفاظ على نمط حياة صحي. حددي موعداً لما قبل الحمل مع مقدم الرعاية الصحية إذا لم تفعلي ذلك بالفعل."
    },
    nutritionAdvice: {
      en: "Ensure adequate protein intake for cell development. Include lean meats, fish, eggs, and legumes. Avoid raw or undercooked foods to prevent infections.",
      ar: "تأكدي من تناول البروتين الكافي لتطوير الخلايا. اشملي اللحوم الخالية من الدهون والأسماك والبيض والبقوليات. تجنبي الأطعمة النيئة أو غير المطبوخة جيداً لمنع العدوى."
    }
  },
  {
    week: 3,
    fetalDevelopment: {
      en: "Implantation occurs this week! Your baby, now called a blastocyst, attaches to your uterine wall. The placenta begins to form, and your baby is about the size of a pinhead.",
      ar: "يحدث الانغراس هذا الأسبوع! طفلك، الذي يُسمى الآن الكيسة الأريمية، يلتصق بجدار الرحم. تبدأ المشيمة في التكون، وطفلك بحجم رأس الدبوس تقريباً."
    },
    maternalChanges: {
      en: "You might experience implantation bleeding - light spotting that's completely normal. Some women feel mild cramping. Your body starts producing hCG hormone.",
      ar: "قد تعانين من نزيف الانغراس - نزيف خفيف وهو أمر طبيعي تماماً. بعض النساء يشعرن بتشنجات خفيفة. جسمك يبدأ في إنتاج هرمون hCG."
    },
    healthTips: {
      en: "Pay attention to your body's signals. Light bleeding is normal, but heavy bleeding should be reported to your doctor. Continue healthy habits and avoid stress.",
      ar: "انتبهي لإشارات جسمك. النزيف الخفيف طبيعي، لكن النزيف الشديد يجب الإبلاغ عنه للطبيب. استمري في العادات الصحية وتجنبي التوتر."
    },
    nutritionAdvice: {
      en: "Focus on foods rich in vitamin B6 to help with early pregnancy symptoms. Include bananas, potatoes, and chicken. Maintain regular meal times to stabilize blood sugar.",
      ar: "ركزي على الأطعمة الغنية بفيتامين B6 للمساعدة في أعراض الحمل المبكرة. اشملي الموز والبطاطس والدجاج. حافظي على أوقات الوجبات المنتظمة لتثبيت سكر الدم."
    }
  },
  {
    week: 4,
    fetalDevelopment: {
      en: "Your baby's neural tube is forming, which will become the brain and spinal cord. The heart is beginning to develop, and your baby is now about the size of a poppy seed.",
      ar: "الأنبوب العصبي لطفلك يتكون، والذي سيصبح الدماغ والحبل الشوكي. القلب يبدأ في التطور، وطفلك الآن بحجم بذرة الخشخاش تقريباً."
    },
    maternalChanges: {
      en: "This is when you might miss your period! You may experience breast tenderness, fatigue, and mood changes. A pregnancy test will likely show positive results now.",
      ar: "هذا هو الوقت الذي قد تفوتين فيه دورتك الشهرية! قد تعانين من حساسية الثدي والتعب وتغيرات المزاج. اختبار الحمل سيظهر على الأرجح نتائج إيجابية الآن."
    },
    healthTips: {
      en: "Take a home pregnancy test if you've missed your period. Schedule your first prenatal appointment. Continue taking prenatal vitamins and avoid harmful substances.",
      ar: "قومي بإجراء اختبار حمل منزلي إذا فاتتك دورتك الشهرية. حددي موعد أول زيارة للرعاية السابقة للولادة. استمري في تناول فيتامينات ما قبل الولادة وتجنبي المواد الضارة."
    },
    nutritionAdvice: {
      en: "Folic acid is crucial now for neural tube development. Ensure you're getting 400-800 mcg daily. Include fortified cereals, spinach, and asparagus in your diet.",
      ar: "حمض الفوليك مهم جداً الآن لتطوير الأنبوب العصبي. تأكدي من الحصول على 400-800 ميكروغرام يومياً. اشملي الحبوب المدعمة والسبانخ والهليون في نظامك الغذائي."
    }
  },
  {
    week: 5,
    fetalDevelopment: {
      en: "Your baby's heart starts beating! The neural tube continues to develop, and tiny limb buds are beginning to form. Your baby is now about the size of a sesame seed.",
      ar: "قلب طفلك يبدأ في النبض! الأنبوب العصبي يستمر في التطور، وبراعم الأطراف الصغيرة تبدأ في التكون. طفلك الآن بحجم بذرة السمسم تقريباً."
    },
    maternalChanges: {
      en: "Morning sickness may begin, though it can happen any time of day. You might feel more tired than usual and notice changes in food preferences or aversions.",
      ar: "قد يبدأ غثيان الصباح، رغم أنه يمكن أن يحدث في أي وقت من اليوم. قد تشعرين بتعب أكثر من المعتاد وتلاحظين تغيرات في تفضيلات الطعام أو النفور منه."
    },
    healthTips: {
      en: "Combat morning sickness with small, frequent meals. Keep crackers by your bedside for morning nausea. Stay hydrated and rest when you can.",
      ar: "حاربي غثيان الصباح بوجبات صغيرة ومتكررة. احتفظي بالبسكويت المملح بجانب سريرك لغثيان الصباح. حافظي على الترطيب واستريحي عندما تستطيعين."
    },
    nutritionAdvice: {
      en: "If nausea makes eating difficult, focus on bland foods like toast, rice, and bananas. Ginger can help with nausea. Take prenatal vitamins with food to reduce stomach upset.",
      ar: "إذا جعل الغثيان الأكل صعباً، ركزي على الأطعمة الخفيفة مثل التوست والأرز والموز. الزنجبيل يمكن أن يساعد في الغثيان. تناولي فيتامينات ما قبل الولادة مع الطعام لتقليل اضطراب المعدة."
    }
  },
  // Continue with weeks 6-40...
  {
    week: 6,
    fetalDevelopment: {
      en: "Your baby's heart is now beating regularly and can be detected on ultrasound. Facial features are beginning to form, including the eyes and nose. Your baby is about the size of a lentil.",
      ar: "قلب طفلك ينبض الآن بانتظام ويمكن اكتشافه بالموجات فوق الصوتية. ملامح الوجه تبدأ في التكون، بما في ذلك العينان والأنف. طفلك بحجم العدس تقريباً."
    },
    maternalChanges: {
      en: "Morning sickness may intensify. You might experience frequent urination, breast changes, and heightened sense of smell. Mood swings are common due to hormonal changes.",
      ar: "قد يشتد غثيان الصباح. قد تعانين من التبول المتكرر وتغيرات الثدي وحاسة شم مرتفعة. تقلبات المزاج شائعة بسبب التغيرات الهرمونية."
    },
    healthTips: {
      en: "Schedule your first prenatal appointment if you haven't already. Discuss any medications you're taking with your doctor. Start documenting your symptoms.",
      ar: "حددي موعد أول زيارة للرعاية السابقة للولادة إذا لم تفعلي ذلك بالفعل. ناقشي أي أدوية تتناولينها مع طبيبك. ابدئي في توثيق أعراضك."
    },
    nutritionAdvice: {
      en: "Continue with prenatal vitamins. If morning sickness is severe, try eating small amounts frequently. Avoid strong smells that trigger nausea.",
      ar: "استمري في تناول فيتامينات ما قبل الولادة. إذا كان غثيان الصباح شديداً، حاولي تناول كميات صغيرة بشكل متكرر. تجنبي الروائح القوية التي تثير الغثيان."
    }
  },
  // Add more weeks as needed...
  {
    week: 7,
    fetalDevelopment: {
      en: "Your baby is growing rapidly! The brain is developing quickly, and tiny arms and legs are forming. Your baby is about the size of a blueberry.",
      ar: "طفلك ينمو بسرعة! الدماغ يتطور بسرعة، والذراعان والساقان الصغيرتان تتكونان. طفلك بحجم التوت الأزرق تقريباً."
    },
    maternalChanges: {
      en: "Morning sickness may peak around this time. You might experience food aversions, increased saliva production, and emotional changes.",
      ar: "قد يصل غثيان الصباح إلى ذروته في هذا الوقت. قد تعانين من النفور من الطعام وزيادة إنتاج اللعاب والتغيرات العاطفية."
    },
    healthTips: {
      en: "Eat small, frequent meals to manage nausea. Stay hydrated and get plenty of rest. Consider ginger tea for nausea relief.",
      ar: "تناولي وجبات صغيرة ومتكررة للتحكم في الغثيان. حافظي على الترطيب واحصلي على الكثير من الراحة. فكري في شاي الزنجبيل لتخفيف الغثيان."
    },
    nutritionAdvice: {
      en: "Focus on foods you can tolerate. Protein is important for your baby's development. Try nuts, yogurt, and lean meats if you can keep them down.",
      ar: "ركزي على الأطعمة التي يمكنك تحملها. البروتين مهم لتطوير طفلك. جربي المكسرات واللبن واللحوم الخالية من الدهون إذا كنت تستطيعين الاحتفاظ بها."
    }
  },
  {
    week: 8,
    fetalDevelopment: {
      en: "Your baby's major organs are forming! Tiny fingers and toes are developing, and the heart has four chambers. Your baby is about the size of a kidney bean.",
      ar: "الأعضاء الرئيسية لطفلك تتكون! الأصابع الصغيرة وأصابع القدم تتطور، والقلب له أربع حجرات. طفلك بحجم حبة الفاصوليا تقريباً."
    },
    maternalChanges: {
      en: "Your uterus is expanding, though you may not show yet. Breast tenderness continues, and you might notice changes in skin pigmentation.",
      ar: "رحمك يتوسع، رغم أنك قد لا تظهرين بعد. حساسية الثدي تستمر، وقد تلاحظين تغيرات في تصبغ الجلد."
    },
    healthTips: {
      en: "Continue prenatal vitamins and avoid harmful substances. Start thinking about telling close family and friends about your pregnancy.",
      ar: "استمري في تناول فيتامينات ما قبل الولادة وتجنبي المواد الضارة. ابدئي في التفكير في إخبار العائلة والأصدقاء المقربين عن حملك."
    },
    nutritionAdvice: {
      en: "Calcium is becoming more important for bone development. Include dairy products, leafy greens, and fortified foods in your diet.",
      ar: "الكالسيوم يصبح أكثر أهمية لتطوير العظام. اشملي منتجات الألبان والخضروات الورقية والأطعمة المدعمة في نظامك الغذائي."
    }
  },
  {
    week: 9,
    fetalDevelopment: {
      en: "Your baby's tail is disappearing! Arms and legs are growing, and tiny earlobes are forming. Your baby is about the size of a grape.",
      ar: "ذيل طفلك يختفي! الذراعان والساقان تنموان، وشحمات الأذن الصغيرة تتكون. طفلك بحجم حبة العنب تقريباً."
    },
    maternalChanges: {
      en: "Morning sickness may still be present. You might notice increased vaginal discharge and breast changes. Fatigue is common.",
      ar: "قد يستمر غثيان الصباح. قد تلاحظين زيادة في الإفرازات المهبلية وتغيرات في الثدي. التعب شائع."
    },
    healthTips: {
      en: "Continue prenatal vitamins and get plenty of rest. Light exercise like walking can help with fatigue and mood.",
      ar: "استمري في تناول فيتامينات ما قبل الولادة واحصلي على الكثير من الراحة. التمارين الخفيفة مثل المشي يمكن أن تساعد في التعب والمزاج."
    },
    nutritionAdvice: {
      en: "Eat small, frequent meals to manage nausea. Include foods rich in vitamin B6 like bananas and whole grains.",
      ar: "تناولي وجبات صغيرة ومتكررة للتحكم في الغثيان. اشملي الأطعمة الغنية بفيتامين B6 مثل الموز والحبوب الكاملة."
    }
  },
  {
    week: 10,
    fetalDevelopment: {
      en: "Your baby is officially a fetus now! All vital organs are formed and functioning. Tiny teeth buds are developing. Your baby is about the size of a strawberry.",
      ar: "طفلك رسمياً جنين الآن! جميع الأعضاء الحيوية مكونة وتعمل. براعم الأسنان الصغيرة تتطور. طفلك بحجم الفراولة تقريباً."
    },
    maternalChanges: {
      en: "You may start to feel better as morning sickness begins to ease for some women. Your clothes might feel tighter around the waist.",
      ar: "قد تبدئين في الشعور بتحسن حيث يبدأ غثيان الصباح في التحسن لبعض النساء. ملابسك قد تشعر بأنها أضيق حول الخصر."
    },
    healthTips: {
      en: "This is a good time for your first prenatal appointment if you haven't had one yet. Discuss any concerns with your healthcare provider.",
      ar: "هذا وقت جيد لأول موعد للرعاية السابقة للولادة إذا لم تحصلي على واحد بعد. ناقشي أي مخاوف مع مقدم الرعاية الصحية."
    },
    nutritionAdvice: {
      en: "Your appetite may start returning. Focus on nutrient-dense foods and continue with prenatal vitamins. Stay hydrated.",
      ar: "شهيتك قد تبدأ في العودة. ركزي على الأطعمة الغنية بالعناصر الغذائية واستمري في تناول فيتامينات ما قبل الولادة. حافظي على الترطيب."
    }
  },
  {
    week: 11,
    fetalDevelopment: {
      en: "Your baby's head is almost half the size of their body! Hands and feet are webbed, and tiny nails are beginning to form. Your baby is about the size of a fig.",
      ar: "رأس طفلك تقريباً نصف حجم جسمه! اليدان والقدمان متصلتان بأغشية، والأظافر الصغيرة تبدأ في التكون. طفلك بحجم التينة تقريباً."
    },
    maternalChanges: {
      en: "Morning sickness may start to improve. You might notice increased thirst and frequent urination continues.",
      ar: "قد يبدأ غثيان الصباح في التحسن. قد تلاحظين زيادة في العطش واستمرار التبول المتكرر."
    },
    healthTips: {
      en: "Stay hydrated and continue with regular prenatal care. Consider joining pregnancy support groups.",
      ar: "حافظي على الترطيب واستمري في الرعاية المنتظمة قبل الولادة. فكري في الانضمام إلى مجموعات دعم الحمل."
    },
    nutritionAdvice: {
      en: "Continue balanced nutrition with plenty of fruits and vegetables. Calcium and vitamin D are important now.",
      ar: "استمري في التغذية المتوازنة مع الكثير من الفواكه والخضروات. الكالسيوم وفيتامين D مهمان الآن."
    }
  },
  {
    week: 12,
    fetalDevelopment: {
      en: "Your baby is now fully formed! All major organs are developed and functioning. Fingernails are growing, and your baby can make a fist. Your baby is about the size of a lime.",
      ar: "طفلك مكتمل التكوين الآن! جميع الأعضاء الرئيسية متطورة وتعمل. أظافر الأصابع تنمو، وطفلك يستطيع أن يقبض قبضة. طفلك بحجم الليمونة الخضراء تقريباً."
    },
    maternalChanges: {
      en: "You're entering the second trimester! Morning sickness may start to ease. You might notice your clothes getting tighter around the waist. Energy levels often improve.",
      ar: "أنت تدخلين الثلث الثاني! قد يبدأ غثيان الصباح في التحسن. قد تلاحظين أن ملابسك تصبح أضيق حول الخصر. مستويات الطاقة غالباً ما تتحسن."
    },
    healthTips: {
      en: "This is a good time to announce your pregnancy if you choose to. Consider genetic screening tests. Start thinking about prenatal classes.",
      ar: "هذا وقت جيد للإعلان عن حملك إذا اخترت ذلك. فكري في اختبارات الفحص الوراثي. ابدئي في التفكير في فصول ما قبل الولادة."
    },
    nutritionAdvice: {
      en: "Your appetite may return. Focus on nutrient-dense foods. Increase your caloric intake by about 300 calories per day. Include plenty of protein and healthy fats.",
      ar: "قد تعود شهيتك. ركزي على الأطعمة الغنية بالعناصر الغذائية. زيدي من تناولك للسعرات الحرارية بحوالي 300 سعرة حرارية يومياً. اشملي الكثير من البروتين والدهون الصحية."
    }
  },
  {
    week: 13,
    fetalDevelopment: {
      en: "Your baby's intestines are moving from the umbilical cord into the abdomen. Vocal cords are forming. Your baby is about the size of a peapod.",
      ar: "أمعاء طفلك تنتقل من الحبل السري إلى البطن. الحبال الصوتية تتكون. طفلك بحجم قرن البازلاء تقريباً."
    },
    maternalChanges: {
      en: "Welcome to the second trimester! Energy levels improve and morning sickness typically eases. You may start to show.",
      ar: "مرحباً بك في الثلث الثاني! مستويات الطاقة تتحسن وغثيان الصباح عادة يخف. قد تبدئين في الظهور."
    },
    healthTips: {
      en: "Start thinking about maternity clothes. Continue regular exercise like walking or swimming. Schedule regular prenatal checkups.",
      ar: "ابدئي في التفكير في ملابس الأمومة. استمري في التمارين المنتظمة مثل المشي أو السباحة. حددي مواعيد الفحوصات المنتظمة قبل الولادة."
    },
    nutritionAdvice: {
      en: "Increase protein intake for fetal growth. Include fish rich in omega-3 fatty acids (avoid high-mercury fish). Add extra calories gradually.",
      ar: "زيدي من تناول البروتين لنمو الجنين. اشملي الأسماك الغنية بأحماض أوميغا-3 الدهنية (تجنبي الأسماك عالية الزئبق). أضيفي سعرات حرارية إضافية تدريجياً."
    }
  },
  {
    week: 14,
    fetalDevelopment: {
      en: "Your baby can squint, frown, and make facial expressions! The roof of the mouth is forming. Your baby is about the size of a lemon.",
      ar: "طفلك يستطيع التحديق والعبوس وعمل تعابير الوجه! سقف الفم يتكون. طفلك بحجم الليمونة تقريباً."
    },
    maternalChanges: {
      en: "You may notice a slight baby bump now. Energy levels continue to improve, and you might feel more like yourself again.",
      ar: "قد تلاحظين نتوء طفل خفيف الآن. مستويات الطاقة تستمر في التحسن، وقد تشعرين بأنك عدت لنفسك مرة أخرى."
    },
    healthTips: {
      en: "Continue with regular exercise suitable for pregnancy. Practice good posture to prevent back pain. Stay active but listen to your body.",
      ar: "استمري في التمارين المنتظمة المناسبة للحمل. مارسي الوضعية الجيدة لمنع آلام الظهر. ابقي نشيطة لكن استمعي لجسمك."
    },
    nutritionAdvice: {
      en: "Focus on iron-rich foods to prevent anemia. Include vitamin C to help iron absorption. Stay hydrated with water and fresh juices.",
      ar: "ركزي على الأطعمة الغنية بالحديد لمنع فقر الدم. اشملي فيتامين C للمساعدة في امتصاص الحديد. حافظي على الترطيب بالماء والعصائر الطازجة."
    }
  },
  {
    week: 15,
    fetalDevelopment: {
      en: "Your baby's bones are hardening, and they can move all their joints! Hair pattern on the scalp is developing. Your baby is about the size of an apple.",
      ar: "عظام طفلك تتصلب، ويستطيع تحريك جميع مفاصله! نمط الشعر على فروة الرأس يتطور. طفلك بحجم التفاحة تقريباً."
    },
    maternalChanges: {
      en: "Your uterus is expanding and you may feel round ligament pain. The top of your uterus is now midway between your pubic bone and belly button.",
      ar: "رحمك يتوسع وقد تشعرين بألم الرباط المستدير. أعلى رحمك الآن في منتصف الطريق بين عظم العانة وزر البطن."
    },
    healthTips: {
      en: "Consider prenatal yoga or gentle stretching for flexibility. Start planning your birth preferences. Research hospitals or birth centers.",
      ar: "فكري في يوغا ما قبل الولادة أو التمدد اللطيف للمرونة. ابدئي في التخطيط لتفضيلات الولادة. ابحثي عن المستشفيات أو مراكز الولادة."
    },
    nutritionAdvice: {
      en: "Increase calcium for bone development. Include dairy, leafy greens, and fortified foods. Eat healthy snacks between meals.",
      ar: "زيدي من الكالسيوم لتطوير العظام. اشملي الألبان والخضروات الورقية والأطعمة المدعمة. تناولي وجبات خفيفة صحية بين الوجبات."
    }
  },
  {
    week: 16,
    fetalDevelopment: {
      en: "Your baby can hear your voice! The nervous system is functioning, and your baby may start sucking their thumb. Your baby is about the size of an avocado.",
      ar: "طفلك يستطيع سماع صوتك! الجهاز العصبي يعمل، وطفلك قد يبدأ في مص إبهامه. طفلك بحجم الأفوكادو تقريباً."
    },
    maternalChanges: {
      en: "You might start feeling your baby's first movements, called quickening. Your belly is becoming more noticeable, and you may have a pregnancy glow.",
      ar: "قد تبدئين في الشعور بأول حركات طفلك، تسمى الحيوية. بطنك تصبح أكثر وضوحاً، وقد يكون لديك إشراق الحمل."
    },
    healthTips: {
      en: "Start doing pelvic floor exercises. Consider maternity clothes for comfort. This is often when the anatomy scan is scheduled.",
      ar: "ابدئي في ممارسة تمارين قاع الحوض. فكري في ملابس الأمومة للراحة. هذا غالباً عندما يتم جدولة فحص التشريح."
    },
    nutritionAdvice: {
      en: "Iron needs are increasing. Include iron-rich foods like lean meats, beans, and fortified cereals. Vitamin C helps with iron absorption.",
      ar: "احتياجات الحديد تزداد. اشملي الأطعمة الغنية بالحديد مثل اللحوم الخالية من الدهون والفاصوليا والحبوب المدعمة. فيتامين C يساعد في امتصاص الحديد."
    }
  },
  {
    week: 17,
    fetalDevelopment: {
      en: "Your baby's skeleton is changing from soft cartilage to bone. Fat is beginning to develop under the skin. Your baby is about the size of a pear.",
      ar: "هيكل طفلك يتحول من غضروف ناعم إلى عظم. الدهون تبدأ في التطور تحت الجلد. طفلك بحجم الكمثرى تقريباً."
    },
    maternalChanges: {
      en: "You may feel more baby movements now. Your center of gravity is shifting, so be careful with balance. Increased appetite is common.",
      ar: "قد تشعرين بمزيد من حركات الطفل الآن. مركز ثقلك يتغير، لذا كوني حذرة مع التوازن. زيادة الشهية شائعة."
    },
    healthTips: {
      en: "Continue prenatal vitamins and moderate exercise. Start sleeping on your side. Consider pregnancy support pillows for comfort.",
      ar: "استمري في فيتامينات ما قبل الولادة والتمارين المعتدلة. ابدئي في النوم على جانبك. فكري في وسائد دعم الحمل للراحة."
    },
    nutritionAdvice: {
      en: "Focus on healthy fats for brain development. Include avocados, nuts, and olive oil. Keep meals balanced with proteins and vegetables.",
      ar: "ركزي على الدهون الصحية لتطوير الدماغ. اشملي الأفوكادو والمكسرات وزيت الزيتون. حافظي على توازن الوجبات مع البروتينات والخضروات."
    }
  },
  {
    week: 18,
    fetalDevelopment: {
      en: "Your baby's ears are now in their final position! They can hear sounds from outside. Your baby is about the size of a bell pepper.",
      ar: "أذنا طفلك الآن في وضعهما النهائي! يستطيع سماع الأصوات من الخارج. طفلك بحجم الفلفل الحلو تقريباً."
    },
    maternalChanges: {
      en: "You should be feeling regular baby movements now. Your uterus is about the size of a cantaloupe. You may experience leg cramps.",
      ar: "يجب أن تشعري بحركات منتظمة للطفل الآن. رحمك بحجم الشمام تقريباً. قد تعانين من تشنجات الساق."
    },
    healthTips: {
      en: "Stretch before bed to prevent leg cramps. Stay hydrated and active. This is a good time for the anatomy ultrasound.",
      ar: "تمددي قبل النوم لمنع تشنجات الساق. حافظي على الترطيب والنشاط. هذا وقت جيد للموجات فوق الصوتية التشريحية."
    },
    nutritionAdvice: {
      en: "Ensure adequate protein and calcium intake. Include magnesium-rich foods like bananas and spinach to help prevent cramps.",
      ar: "تأكدي من تناول البروتين والكالسيوم الكافي. اشملي الأطعمة الغنية بالمغنيسيوم مثل الموز والسبانخ للمساعدة في منع التشنجات."
    }
  },
  {
    week: 19,
    fetalDevelopment: {
      en: "Vernix caseosa, a protective coating, is covering your baby's skin. Sensory development is in high gear. Your baby is about the size of a mango.",
      ar: "الطلاء الجبني، طبقة واقية، تغطي جلد طفلك. التطور الحسي في قمته. طفلك بحجم المانجو تقريباً."
    },
    maternalChanges: {
      en: "Your belly button may start to pop out. You might experience heartburn and indigestion. Baby movements are becoming stronger.",
      ar: "زر بطنك قد يبدأ في البروز. قد تعانين من حرقة المعدة وعسر الهضم. حركات الطفل تصبح أقوى."
    },
    healthTips: {
      en: "Eat smaller, more frequent meals to help with digestion. Avoid lying down right after eating. Consider prenatal massage for relaxation.",
      ar: "تناولي وجبات أصغر وأكثر تكراراً للمساعدة في الهضم. تجنبي الاستلقاء مباشرة بعد الأكل. فكري في تدليك ما قبل الولادة للاسترخاء."
    },
    nutritionAdvice: {
      en: "Continue with balanced nutrition. Avoid spicy and fatty foods if you have heartburn. Stay hydrated throughout the day.",
      ar: "استمري في التغذية المتوازنة. تجنبي الأطعمة الحارة والدهنية إذا كنت تعانين من حرقة المعدة. حافظي على الترطيب طوال اليوم."
    }
  },
  {
    week: 20,
    fetalDevelopment: {
      en: "You're halfway there! Your baby can hear sounds from outside the womb and may respond to your voice. Hair is growing on the head, and the baby is about the size of a banana.",
      ar: "أنت في منتصف الطريق! طفلك يستطيع سماع الأصوات من خارج الرحم وقد يستجيب لصوتك. الشعر ينمو على الرأس، والطفل بحجم الموزة تقريباً."
    },
    maternalChanges: {
      en: "You may start feeling your baby's movements! Your belly is clearly showing now. You might experience back pain as your center of gravity shifts.",
      ar: "قد تبدئين في الشعور بحركات طفلك! بطنك تظهر بوضوح الآن. قد تعانين من آلام الظهر حيث يتغير مركز الثقل لديك."
    },
    healthTips: {
      en: "This is typically when you'll have your anatomy scan ultrasound. Start sleeping on your side. Consider maternity clothes for comfort.",
      ar: "هذا عادة عندما ستخضعين لفحص الموجات فوق الصوتية التشريحي. ابدئي في النوم على جانبك. فكري في ملابس الأمومة للراحة."
    },
    nutritionAdvice: {
      en: "Iron needs increase significantly now. Include iron-rich foods like lean red meat, spinach, and beans. Vitamin C helps iron absorption.",
      ar: "احتياجات الحديد تزداد بشكل كبير الآن. اشملي الأطعمة الغنية بالحديد مثل اللحوم الحمراء الخالية من الدهون والسبانخ والفاصوليا. فيتامين C يساعد في امتصاص الحديد."
    }
  },
  {
    week: 21,
    fetalDevelopment: {
      en: "Your baby's movements are becoming more coordinated! Eyebrows and eyelids are fully developed. Your baby is about the size of a carrot.",
      ar: "حركات طفلك تصبح أكثر تنسيقاً! الحواجب والجفون متطورة بالكامل. طفلك بحجم الجزرة تقريباً."
    },
    maternalChanges: {
      en: "You may notice Braxton Hicks contractions - practice contractions that prepare your body. Your baby's kicks are getting stronger.",
      ar: "قد تلاحظين انقباضات براكستون هيكس - انقباضات تدريبية تحضر جسمك. ركلات طفلك تصبح أقوى."
    },
    healthTips: {
      en: "Stay hydrated to minimize Braxton Hicks. Continue regular exercise. Monitor your baby's movement patterns.",
      ar: "حافظي على الترطيب لتقليل براكستون هيكس. استمري في التمارين المنتظمة. راقبي أنماط حركة طفلك."
    },
    nutritionAdvice: {
      en: "Focus on foods rich in DHA for brain development. Include salmon, walnuts, and chia seeds. Continue balanced meals.",
      ar: "ركزي على الأطعمة الغنية بـ DHA لتطوير الدماغ. اشملي السلمون والجوز وبذور الشيا. استمري في الوجبات المتوازنة."
    }
  },
  {
    week: 22,
    fetalDevelopment: {
      en: "Your baby's senses are developing rapidly! They can feel, hear, and see light through your belly. Your baby is about the size of a papaya.",
      ar: "حواس طفلك تتطور بسرعة! يستطيع الشعور والسماع ورؤية الضوء عبر بطنك. طفلك بحجم البابايا تقريباً."
    },
    maternalChanges: {
      en: "Your belly is growing noticeably. You may experience swelling in your feet and ankles. Energy levels remain good in the second trimester.",
      ar: "بطنك تنمو بشكل ملحوظ. قد تعانين من تورم في قدميك وكاحليك. مستويات الطاقة تبقى جيدة في الثلث الثاني."
    },
    healthTips: {
      en: "Elevate your feet when resting to reduce swelling. Wear comfortable, supportive shoes. Stay active but avoid overheating.",
      ar: "ارفعي قدميك عند الراحة لتقليل التورم. ارتدي أحذية مريحة وداعمة. ابقي نشيطة لكن تجنبي الحرارة الزائدة."
    },
    nutritionAdvice: {
      en: "Reduce sodium to minimize swelling. Eat potassium-rich foods like bananas and sweet potatoes. Stay well-hydrated.",
      ar: "قللي من الصوديوم لتقليل التورم. تناولي الأطعمة الغنية بالبوتاسيوم مثل الموز والبطاطا الحلوة. حافظي على الترطيب الجيد."
    }
  },
  {
    week: 23,
    fetalDevelopment: {
      en: "Your baby's lungs are developing rapidly, preparing for breathing. Fingerprints and footprints are forming. Your baby is about the size of a grapefruit.",
      ar: "رئتا طفلك تتطوران بسرعة، تستعدان للتنفس. بصمات الأصابع والقدم تتكون. طفلك بحجم الجريب فروت تقريباً."
    },
    maternalChanges: {
      en: "You may feel your baby hiccup! Your skin may stretch, causing itchiness. You might notice a dark line (linea nigra) on your belly.",
      ar: "قد تشعرين بطفلك يصاب بالفواق! جلدك قد يتمدد، مما يسبب الحكة. قد تلاحظين خطاً داكناً (الخط الأسود) على بطنك."
    },
    healthTips: {
      en: "Moisturize your skin to help with stretching and itching. Continue monitoring baby movements. Stay comfortable with maternity wear.",
      ar: "رطبي بشرتك للمساعدة في التمدد والحكة. استمري في مراقبة حركات الطفل. ابقي مرتاحة بملابس الأمومة."
    },
    nutritionAdvice: {
      en: "Continue with prenatal vitamins and balanced diet. Include foods rich in vitamin E for skin health. Stay hydrated for skin elasticity.",
      ar: "استمري في فيتامينات ما قبل الولادة ونظام غذائي متوازن. اشملي الأطعمة الغنية بفيتامين E لصحة الجلد. حافظي على الترطيب لمرونة الجلد."
    }
  },
  {
    week: 24,
    fetalDevelopment: {
      en: "Your baby's hearing is fully developed! They can respond to sounds and may be startled by loud noises. Your baby is about the size of an ear of corn.",
      ar: "سمع طفلك متطور بالكامل! يستطيع الاستجابة للأصوات وقد يفزع من الأصوات العالية. طفلك بحجم كوز الذرة تقريباً."
    },
    maternalChanges: {
      en: "You may experience round ligament pain as your uterus grows. Your baby's movements are becoming stronger and more frequent.",
      ar: "قد تعانين من ألم الرباط المستدير حيث ينمو رحمك. حركات طفلك تصبح أقوى وأكثر تكراراً."
    },
    healthTips: {
      en: "Start monitoring your baby's movements. Consider glucose screening for gestational diabetes. Practice good posture to help with back pain.",
      ar: "ابدئي في مراقبة حركات طفلك. فكري في فحص الجلوكوز لسكري الحمل. مارسي الوضعية الجيدة للمساعدة في آلام الظهر."
    },
    nutritionAdvice: {
      en: "Focus on healthy weight gain. Include omega-3 fatty acids for brain development. Limit processed foods and added sugars.",
      ar: "ركزي على زيادة الوزن الصحية. اشملي أحماض أوميغا-3 الدهنية لتطوير الدماغ. قللي من الأطعمة المصنعة والسكريات المضافة."
    }
  },
  {
    week: 25,
    fetalDevelopment: {
      en: "Your baby's nostrils are starting to work! Blood vessels in the lungs are developing. Your baby is about the size of a rutabaga.",
      ar: "فتحات أنف طفلك تبدأ في العمل! الأوعية الدموية في الرئتين تتطور. طفلك بحجم اللفت السويدي تقريباً."
    },
    maternalChanges: {
      en: "You may experience more vivid dreams. Your growing belly might make sleeping uncomfortable. Heartburn may increase.",
      ar: "قد تعانين من أحلام أكثر وضوحاً. بطنك المتنامي قد يجعل النوم غير مريح. حرقة المعدة قد تزداد."
    },
    healthTips: {
      en: "Use pregnancy pillows for better sleep. Eat smaller meals to reduce heartburn. Continue regular prenatal checkups.",
      ar: "استخدمي وسائد الحمل لنوم أفضل. تناولي وجبات أصغر لتقليل حرقة المعدة. استمري في الفحوصات المنتظمة قبل الولادة."
    },
    nutritionAdvice: {
      en: "Continue with iron and calcium-rich foods. Avoid eating late at night to minimize heartburn. Stay hydrated throughout the day.",
      ar: "استمري في الأطعمة الغنية بالحديد والكالسيوم. تجنبي الأكل في وقت متأخر من الليل لتقليل حرقة المعدة. حافظي على الترطيب طوال اليوم."
    }
  },
  {
    week: 26,
    fetalDevelopment: {
      en: "Your baby's eyes are beginning to open! They can now blink. Your baby is about the size of a scallion.",
      ar: "عينا طفلك تبدآن في الفتح! يستطيع الآن الرمش. طفلك بحجم البصل الأخضر تقريباً."
    },
    maternalChanges: {
      en: "You're nearing the third trimester! You may notice more Braxton Hicks contractions. Your belly is getting larger.",
      ar: "أنت تقتربين من الثلث الثالث! قد تلاحظين المزيد من انقباضات براكستون هيكس. بطنك يكبر."
    },
    healthTips: {
      en: "Practice relaxation techniques for stress management. Start thinking about your birth plan. Continue moderate exercise.",
      ar: "تدربي على تقنيات الاسترخاء لإدارة التوتر. ابدئي في التفكير في خطة الولادة. استمري في التمارين المعتدلة."
    },
    nutritionAdvice: {
      en: "Focus on foods that support lung development. Include vitamin A-rich foods like carrots and sweet potatoes.",
      ar: "ركزي على الأطعمة التي تدعم تطوير الرئة. اشملي الأطعمة الغنية بفيتامين A مثل الجزر والبطاطا الحلوة."
    }
  },
  {
    week: 27,
    fetalDevelopment: {
      en: "Your baby's lungs, liver, and immune system are maturing. Your baby can recognize your voice now. Your baby is about the size of a cauliflower.",
      ar: "رئتا طفلك وكبده وجهازه المناعي تنضج. طفلك يستطيع التعرف على صوتك الآن. طفلك بحجم القرنبيط تقريباً."
    },
    maternalChanges: {
      en: "You're finishing the second trimester! You may feel more tired and experience leg cramps. Baby movements are very noticeable now.",
      ar: "أنت تنهين الثلث الثاني! قد تشعرين بمزيد من التعب وتعانين من تشنجات الساق. حركات الطفل ملحوظة جداً الآن."
    },
    healthTips: {
      en: "Stretch regularly to prevent cramps. Ensure good sleep hygiene. Start preparing the nursery if you haven't already.",
      ar: "تمددي بانتظام لمنع التشنجات. تأكدي من نظافة النوم الجيدة. ابدئي في تحضير غرفة الطفل إذا لم تفعلي ذلك بالفعل."
    },
    nutritionAdvice: {
      en: "Increase protein intake for rapid growth. Include foods rich in magnesium and potassium to help with cramps.",
      ar: "زيدي من تناول البروتين للنمو السريع. اشملي الأطعمة الغنية بالمغنيسيوم والبوتاسيوم للمساعدة في التشنجات."
    }
  },
  {
    week: 28,
    fetalDevelopment: {
      en: "Your baby's brain is developing rapidly, and they can blink their eyes. They're practicing breathing movements and can respond to light. Your baby is about the size of an eggplant.",
      ar: "دماغ طفلك يتطور بسرعة، ويستطيع أن يرمش بعينيه. يتدرب على حركات التنفس ويستطيع الاستجابة للضوء. طفلك بحجم الباذنجان تقريباً."
    },
    maternalChanges: {
      en: "You're entering the third trimester! You may experience more frequent urination, heartburn, and shortness of breath as your baby grows larger.",
      ar: "أنت تدخلين الثلث الثالث! قد تعانين من التبول المتكرر وحرقة المعدة وضيق التنفس حيث ينمو طفلك أكبر."
    },
    healthTips: {
      en: "Start monitoring your baby's movements daily. Discuss your birth plan with your healthcare provider. Consider taking childbirth classes.",
      ar: "ابدئي في مراقبة حركات طفلك يومياً. ناقشي خطة الولادة مع مقدم الرعاية الصحية. فكري في أخذ فصول الولادة."
    },
    nutritionAdvice: {
      en: "Focus on calcium for your baby's bone development. Include dairy products, leafy greens, and fortified foods. Stay hydrated to help with circulation.",
      ar: "ركزي على الكالسيوم لتطوير عظام طفلك. اشملي منتجات الألبان والخضروات الورقية والأطعمة المدعمة. حافظي على الترطيب للمساعدة في الدورة الدموية."
    }
  },
  {
    week: 29,
    fetalDevelopment: {
      en: "Your baby is adding fat layers and growing rapidly! Brain development continues at a fast pace. Your baby is about the size of a butternut squash.",
      ar: "طفلك يضيف طبقات من الدهون وينمو بسرعة! تطور الدماغ يستمر بوتيرة سريعة. طفلك بحجم القرع الجوزي تقريباً."
    },
    maternalChanges: {
      en: "You may feel more tired and experience back pain. Your baby's movements might feel different as space becomes limited.",
      ar: "قد تشعرين بمزيد من التعب وتعانين من آلام الظهر. حركات طفلك قد تشعر بأنها مختلفة حيث تصبح المساحة محدودة."
    },
    healthTips: {
      en: "Use support pillows and practice good posture. Rest when needed. Start preparing your hospital bag.",
      ar: "استخدمي وسائد الدعم ومارسي الوضعية الجيدة. استريحي عند الحاجة. ابدئي في تحضير حقيبة المستشفى."
    },
    nutritionAdvice: {
      en: "Continue with iron-rich foods and prenatal vitamins. Eat smaller, frequent meals to help with digestion.",
      ar: "استمري في الأطعمة الغنية بالحديد وفيتامينات ما قبل الولادة. تناولي وجبات أصغر ومتكررة للمساعدة في الهضم."
    }
  },
  {
    week: 30,
    fetalDevelopment: {
      en: "Your baby's bone marrow is producing red blood cells. Lanugo hair is starting to disappear. Your baby is about the size of a cabbage.",
      ar: "نخاع عظام طفلك ينتج خلايا الدم الحمراء. شعر الزغب يبدأ في الاختفاء. طفلك بحجم الملفوف تقريباً."
    },
    maternalChanges: {
      en: "You may feel clumsy as your center of gravity shifts. Swelling in hands and feet may increase. Sleep may become more difficult.",
      ar: "قد تشعرين بالخرق حيث يتغير مركز ثقلك. التورم في اليدين والقدمين قد يزداد. النوم قد يصبح أكثر صعوبة."
    },
    healthTips: {
      en: "Elevate your feet to reduce swelling. Practice relaxation and breathing techniques. Continue monitoring baby movements.",
      ar: "ارفعي قدميك لتقليل التورم. تدربي على تقنيات الاسترخاء والتنفس. استمري في مراقبة حركات الطفل."
    },
    nutritionAdvice: {
      en: "Reduce salt intake to minimize swelling. Focus on foods rich in vitamin K for blood clotting. Stay well-hydrated.",
      ar: "قللي من تناول الملح لتقليل التورم. ركزي على الأطعمة الغنية بفيتامين K لتخثر الدم. حافظي على الترطيب الجيد."
    }
  },
  {
    week: 31,
    fetalDevelopment: {
      en: "Your baby's major organs are fully developed and just maturing! They're gaining weight rapidly. Your baby is about the size of a coconut.",
      ar: "الأعضاء الرئيسية لطفلك متطورة بالكامل وتنضج فقط! يكتسب الوزن بسرعة. طفلك بحجم جوزة الهند تقريباً."
    },
    maternalChanges: {
      en: "Braxton Hicks contractions may become more frequent. You may experience increased vaginal discharge. Shortness of breath is common.",
      ar: "انقباضات براكستون هيكس قد تصبح أكثر تكراراً. قد تعانين من زيادة الإفرازات المهبلية. ضيق التنفس شائع."
    },
    healthTips: {
      en: "Practice breathing exercises for labor preparation. Stay hydrated to minimize contractions. Rest frequently.",
      ar: "تدربي على تمارين التنفس للتحضير للمخاض. حافظي على الترطيب لتقليل الانقباضات. استريحي بشكل متكرر."
    },
    nutritionAdvice: {
      en: "Continue with balanced nutrition. Include foods that boost energy levels. Eat fiber-rich foods to prevent constipation.",
      ar: "استمري في التغذية المتوازنة. اشملي الأطعمة التي تعزز مستويات الطاقة. تناولي الأطعمة الغنية بالألياف لمنع الإمساك."
    }
  },
  {
    week: 32,
    fetalDevelopment: {
      en: "Your baby's bones are hardening, and they're gaining weight rapidly. They can open and close their eyes and may have developed a sleep pattern. Your baby is about the size of a squash.",
      ar: "عظام طفلك تتصلب، ويكتسب الوزن بسرعة. يستطيع فتح وإغلاق عينيه وقد يكون طور نمط نوم. طفلك بحجم القرع تقريباً."
    },
    maternalChanges: {
      en: "You may feel more tired and uncomfortable. Braxton Hicks contractions may become more noticeable. Your baby's movements may feel different as space becomes limited.",
      ar: "قد تشعرين بتعب وعدم راحة أكثر. انقباضات براكستون هيكس قد تصبح أكثر وضوحاً. حركات طفلك قد تشعر بأنها مختلفة حيث تصبح المساحة محدودة."
    },
    healthTips: {
      en: "Start preparing for labor and delivery. Pack your hospital bag gradually. Practice breathing exercises and relaxation techniques.",
      ar: "ابدئي في التحضير للمخاض والولادة. احزمي حقيبة المستشفى تدريجياً. تدربي على تمارين التنفس وتقنيات الاسترخاء."
    },
    nutritionAdvice: {
      en: "Continue eating well-balanced meals. Focus on foods rich in vitamin K for blood clotting. Include plenty of fiber to help with digestion.",
      ar: "استمري في تناول وجبات متوازنة جيداً. ركزي على الأطعمة الغنية بفيتامين K لتخثر الدم. اشملي الكثير من الألياف للمساعدة في الهضم."
    }
  },
  {
    week: 33,
    fetalDevelopment: {
      en: "Your baby's skull bones are not yet fused, making it easier to pass through the birth canal. Brain and nervous system development continues. Your baby is about the size of a pineapple.",
      ar: "عظام جمجمة طفلك لم تلتحم بعد، مما يجعل المرور عبر قناة الولادة أسهل. تطور الدماغ والجهاز العصبي يستمر. طفلك بحجم الأناناس تقريباً."
    },
    maternalChanges: {
      en: "You may experience increased pelvic pressure as baby drops lower. Frequent urination increases. You might feel more anxious about labor.",
      ar: "قد تعانين من زيادة الضغط على الحوض حيث ينزل الطفل أسفل. التبول المتكرر يزداد. قد تشعرين بمزيد من القلق حول المخاض."
    },
    healthTips: {
      en: "Finalize your birth plan and discuss it with your healthcare provider. Pack your hospital bag. Practice relaxation techniques daily.",
      ar: "أنهي خطة الولادة وناقشيها مع مقدم الرعاية الصحية. احزمي حقيبة المستشفى. تدربي على تقنيات الاسترخاء يومياً."
    },
    nutritionAdvice: {
      en: "Continue balanced meals with focus on energy-rich foods. Stay hydrated. Avoid foods that cause heartburn or indigestion.",
      ar: "استمري في الوجبات المتوازنة مع التركيز على الأطعمة الغنية بالطاقة. حافظي على الترطيب. تجنبي الأطعمة التي تسبب حرقة المعدة أو عسر الهضم."
    }
  },
  {
    week: 34,
    fetalDevelopment: {
      en: "Your baby's central nervous system is maturing. Fat layers continue to develop for temperature regulation. Your baby is about the size of a cantaloupe.",
      ar: "الجهاز العصبي المركزي لطفلك ينضج. طبقات الدهون تستمر في التطور لتنظيم درجة الحرارة. طفلك بحجم الشمام تقريباً."
    },
    maternalChanges: {
      en: "You may notice increased fatigue and difficulty sleeping. Swelling may increase. Braxton Hicks contractions continue.",
      ar: "قد تلاحظين زيادة التعب وصعوبة النوم. التورم قد يزداد. انقباضات براكستون هيكس تستمر."
    },
    healthTips: {
      en: "Rest as much as possible. Elevate your legs to reduce swelling. Know the signs of preterm labor and when to call your doctor.",
      ar: "استريحي قدر الإمكان. ارفعي ساقيك لتقليل التورم. اعرفي علامات المخاض المبكر ومتى تتصلين بطبيبك."
    },
    nutritionAdvice: {
      en: "Continue prenatal vitamins. Eat small, frequent meals. Include foods that promote good sleep like warm milk and bananas.",
      ar: "استمري في فيتامينات ما قبل الولادة. تناولي وجبات صغيرة ومتكررة. اشملي الأطعمة التي تعزز النوم الجيد مثل الحليب الدافئ والموز."
    }
  },
  {
    week: 35,
    fetalDevelopment: {
      en: "Your baby's kidneys are fully developed! Most babies move into head-down position now. Your baby is about the size of a honeydew melon.",
      ar: "كليتا طفلك متطورتان بالكامل! معظم الأطفال ينتقلون إلى وضع الرأس لأسفل الآن. طفلك بحجم شمام العسل تقريباً."
    },
    maternalChanges: {
      en: "You may feel your baby drop lower (lightening). Breathing becomes easier, but pelvic pressure increases. Frequent urination intensifies.",
      ar: "قد تشعرين بنزول طفلك أسفل (التخفيف). التنفس يصبح أسهل، لكن الضغط على الحوض يزداد. التبول المتكرر يشتد."
    },
    healthTips: {
      en: "Know the signs of labor. Ensure car seat is installed properly. Rest and prepare mentally for childbirth.",
      ar: "اعرفي علامات المخاض. تأكدي من تركيب مقعد السيارة بشكل صحيح. استريحي واستعدي نفسياً للولادة."
    },
    nutritionAdvice: {
      en: "Continue healthy eating. Stay hydrated. Avoid foods that may cause digestive issues as labor approaches.",
      ar: "استمري في الأكل الصحي. حافظي على الترطيب. تجنبي الأطعمة التي قد تسبب مشاكل هضمية مع اقتراب المخاض."
    }
  },
  {
    week: 36,
    fetalDevelopment: {
      en: "Your baby is considered full-term soon! Their lungs are maturing, and they're gaining weight rapidly. They're about the size of a romaine lettuce head.",
      ar: "طفلك سيعتبر مكتمل النمو قريباً! رئتاه تنضجان، ويكتسب الوزن بسرعة. هو بحجم رأس الخس الروماني تقريباً."
    },
    maternalChanges: {
      en: "You may feel more uncomfortable as your baby drops lower into your pelvis. Braxton Hicks contractions may become more frequent. You might feel anxious about labor.",
      ar: "قد تشعرين بعدم راحة أكثر حيث ينزل طفلك أسفل في الحوض. انقباضات براكستون هيكس قد تصبح أكثر تكراراً. قد تشعرين بالقلق حول المخاض."
    },
    healthTips: {
      en: "Pack your hospital bag and finalize your birth plan. Practice relaxation techniques for labor. Ensure your car seat is properly installed.",
      ar: "احزمي حقيبة المستشفى وأنهي خطة الولادة. تدربي على تقنيات الاسترخاء للمخاض. تأكدي من تركيب مقعد السيارة بشكل صحيح."
    },
    nutritionAdvice: {
      en: "Continue eating well-balanced meals. Stay hydrated and avoid foods that might cause digestive issues. Consider eating dates, which may help with labor.",
      ar: "استمري في تناول وجبات متوازنة جيداً. حافظي على الترطيب وتجنبي الأطعمة التي قد تسبب مشاكل هضمية. فكري في تناول التمر، الذي قد يساعد في المخاض."
    }
  },
  {
    week: 37,
    fetalDevelopment: {
      en: "Your baby is officially full-term! All organs are ready for life outside the womb. Your baby is practicing breathing and sucking. About the size of a Swiss chard.",
      ar: "طفلك رسمياً مكتمل النمو! جميع الأعضاء جاهزة للحياة خارج الرحم. طفلك يتدرب على التنفس والرضاعة. بحجم السلق السويسري تقريباً."
    },
    maternalChanges: {
      en: "You're full-term! Labor could start any day now. You may lose your mucus plug. Nesting instinct might kick in strongly.",
      ar: "أنت مكتملة النمو! المخاض قد يبدأ في أي يوم الآن. قد تفقدين السدادة المخاطية. غريزة التعشيش قد تظهر بقوة."
    },
    healthTips: {
      en: "Know the signs of labor. Stay close to home. Have your hospital bag ready. Rest when you can and stay calm.",
      ar: "اعرفي علامات المخاض. ابقي قريبة من المنزل. احتفظي بحقيبة المستشفى جاهزة. استريحي عندما تستطيعين وابقي هادئة."
    },
    nutritionAdvice: {
      en: "Eat light, easily digestible meals. Stay hydrated. Dates may help prepare your body for labor. Avoid heavy, greasy foods.",
      ar: "تناولي وجبات خفيفة سهلة الهضم. حافظي على الترطيب. التمر قد يساعد في تحضير جسمك للمخاض. تجنبي الأطعمة الثقيلة والدهنية."
    }
  },
  {
    week: 38,
    fetalDevelopment: {
      en: "Your baby continues to gain weight and shed lanugo. All systems are go for birth! Your baby is about the size of a leek.",
      ar: "طفلك يستمر في اكتساب الوزن والتخلص من الزغب. جميع الأنظمة جاهزة للولادة! طفلك بحجم الكراث تقريباً."
    },
    maternalChanges: {
      en: "You may feel more pressure in your pelvis. Contractions may become more regular. You might experience increased vaginal discharge.",
      ar: "قد تشعرين بمزيد من الضغط في حوضك. الانقباضات قد تصبح أكثر انتظاماً. قد تعانين من زيادة الإفرازات المهبلية."
    },
    healthTips: {
      en: "Monitor contractions and know when to go to the hospital. Stay calm and trust your body. Rest and conserve energy for labor.",
      ar: "راقبي الانقباضات واعرفي متى تذهبين إلى المستشفى. ابقي هادئة وثقي في جسمك. استريحي واحفظي الطاقة للمخاض."
    },
    nutritionAdvice: {
      en: "Eat small, frequent meals. Stay hydrated. Avoid foods that might cause discomfort during labor. Focus on easily digestible foods.",
      ar: "تناولي وجبات صغيرة ومتكررة. حافظي على الترطيب. تجنبي الأطعمة التي قد تسبب عدم الراحة أثناء المخاض. ركزي على الأطعمة سهلة الهضم."
    }
  },
  {
    week: 39,
    fetalDevelopment: {
      en: "Your baby is fully developed and ready to be born! They're just gaining more fat for warmth and energy. About the size of a small watermelon.",
      ar: "طفلك مكتمل التطور وجاهز للولادة! يكتسب المزيد من الدهون للدفء والطاقة فقط. بحجم بطيخة صغيرة تقريباً."
    },
    maternalChanges: {
      en: "You're very close to meeting your baby! You may feel restless and anxious. Labor signs may appear any time now.",
      ar: "أنت قريبة جداً من مقابلة طفلك! قد تشعرين بالقلق والتوتر. علامات المخاض قد تظهر في أي وقت الآن."
    },
    healthTips: {
      en: "Stay active with light walks to encourage labor. Practice breathing and relaxation. Keep your phone charged and hospital bag ready.",
      ar: "ابقي نشيطة مع المشي الخفيف لتشجيع المخاض. تدربي على التنفس والاسترخاء. احتفظي بهاتفك مشحوناً وحقيبة المستشفى جاهزة."
    },
    nutritionAdvice: {
      en: "Eat light, nutritious meals. Stay well-hydrated. Avoid heavy meals. Consider having easy snacks ready for early labor.",
      ar: "تناولي وجبات خفيفة ومغذية. حافظي على الترطيب الجيد. تجنبي الوجبات الثقيلة. فكري في تحضير وجبات خفيفة سهلة للمخاض المبكر."
    }
  },
  {
    week: 40,
    fetalDevelopment: {
      en: "Your baby is ready to meet you! They're fully developed and ready for life outside the womb. Your baby is about the size of a watermelon.",
      ar: "طفلك مستعد لمقابلتك! هو مكتمل النمو ومستعد للحياة خارج الرحم. طفلك بحجم البطيخ تقريباً."
    },
    maternalChanges: {
      en: "You're at your due date! You may feel anxious, excited, and ready to meet your baby. Labor could start any day now. Trust your body and the process.",
      ar: "أنت في موعد الولادة! قد تشعرين بالقلق والإثارة والاستعداد لمقابلة طفلك. المخاض قد يبدأ في أي يوم الآن. ثقي في جسمك والعملية."
    },
    healthTips: {
      en: "Stay calm and patient. Walk regularly to encourage labor. Know the signs of labor and when to call your healthcare provider. Rest when you can.",
      ar: "ابقي هادئة وصبورة. امشي بانتظام لتشجيع المخاض. اعرفي علامات المخاض ومتى تتصلين بمقدم الرعاية الصحية. استريحي عندما تستطيعين."
    },
    nutritionAdvice: {
      en: "Eat light, nutritious meals that are easy to digest. Stay hydrated. Avoid heavy meals that might make you uncomfortable during labor.",
      ar: "تناولي وجبات خفيفة ومغذية وسهلة الهضم. حافظي على الترطيب. تجنبي الوجبات الثقيلة التي قد تجعلك غير مرتاحة أثناء المخاض."
    }
  }
];

export const getWeeklyContent = (week: number): WeeklyContent | null => {
  return pregnancyWeeksData.find(data => data.week === week) || null;
};

export const generateWeeklyScript = (week: number, language: 'en' | 'ar'): string => {
  const content = getWeeklyContent(week);
  if (!content) return '';

  const isArabic = language === 'ar';
  
  if (isArabic) {
    return `مرحباً بك في الأسبوع ${week} من حملك.

تطور الجنين:
${content.fetalDevelopment.ar}

التغيرات الأمومية:
${content.maternalChanges.ar}

نصائح صحية:
${content.healthTips.ar}

نصائح التغذية:
${content.nutritionAdvice.ar}

تذكري أن كل حمل فريد، واستشيري دائماً مقدم الرعاية الصحية للحصول على المشورة الطبية الشخصية.`;
  } else {
    return `Welcome to week ${week} of your pregnancy journey.

Fetal Development:
${content.fetalDevelopment.en}

Maternal Changes:
${content.maternalChanges.en}

Health Tips:
${content.healthTips.en}

Nutrition Advice:
${content.nutritionAdvice.en}

Remember, every pregnancy is unique, and always consult with your healthcare provider for personalized medical advice.`;
  }
};
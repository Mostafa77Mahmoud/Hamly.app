# مكونات الواجهة المتحركة (UI Components)

## نظرة عامة
مكتبة من المكونات المتحركة الاحترافية المصممة خصيصاً لتطبيق HamlyMD الطبي، مع الحفاظ على الطابع الطبي الجاد والاحترافي.

## المكونات المتاحة

### 1. AnimatedButton
زر متحرك مع حركة Scale و Haptic Feedback

```tsx
import { AnimatedButton } from '@/components/ui';

<AnimatedButton
  title="تسجيل الدخول"
  onPress={handleLogin}
  loading={isLoading}
  variant="primary"  // primary | secondary | outline
  size="large"       // small | medium | large
/>
```

**المميزات:**
- حركة Scale خفيفة عند الضغط (0.95)
- Haptic Feedback على الضغط
- 3 أنواع: primary (وردي)، secondary (وردي فاتح)، outline (محدد)
- 3 أحجام: small، medium، large
- دعم حالة التحميل

---

### 2. AnimatedCard
كارت متحرك مع Staggered Animation

```tsx
import { AnimatedCard } from '@/components/ui';

<AnimatedCard
  delay={100}
  onPress={() => handleCardPress()}
  pressable={true}
>
  <Text>محتوى الكارت</Text>
</AnimatedCard>
```

**المميزات:**
- حركة Fade In + Slide Up عند الظهور
- إمكانية التأخير (delay) لعمل Staggered animation
- Scale خفيف عند الضغط
- Haptic Feedback
- يمكن تعطيل خاصية الضغط

---

### 3. Section
مكون لتنظيم المحتوى بشكل احترافي

```tsx
import { Section } from '@/components/ui';

<Section
  title="معلومات الحمل"
  subtitle="تفاصيل الأسبوع الحالي"
  variant="card"    // card | flat
  delay={200}
>
  <View>{/* محتوى القسم */}</View>
</Section>
```

**المميزات:**
- عنوان وعنوان فرعي اختياري
- نوعان: card (كارت أبيض) و flat (شفاف)
- حركة انسيابية عند الظهور
- تأخير قابل للتخصيص

---

### 4. ProgressIndicator
مؤشر تقدم متحرك بالألوان الوردية

```tsx
import { ProgressIndicator } from '@/components/ui';

<ProgressIndicator
  currentWeek={24}
  totalWeeks={40}
  label="تقدم الحمل"
  showPercentage={true}
/>
```

**المميزات:**
- حركة تعبئة سلسة (1.2 ثانية)
- ألوان وردية متدرجة (#E91E63)
- عرض النسبة المئوية
- حركة Scale عند الظهور

---

### 5. ScreenTransition
غلاف للشاشات لإضافة حركة انتقال

```tsx
import { ScreenTransition } from '@/components/ui';

export default function MyScreen() {
  return (
    <ScreenTransition>
      <View>{/* محتوى الشاشة */}</View>
    </ScreenTransition>
  );
}
```

**المميزات:**
- Fade In + Slide Up تلقائي عند فتح الشاشة
- يدعم جميع خصائص View
- خفيف وسريع

---

## أمثلة الاستخدام

### مثال 1: شاشة تسجيل دخول محسّنة

```tsx
import { AnimatedButton, ScreenTransition } from '@/components/ui';

export default function LoginScreen() {
  return (
    <ScreenTransition>
      <View style={styles.container}>
        <Text style={styles.title}>مرحباً بعودتك</Text>
        
        {/* حقول الإدخال */}
        
        <AnimatedButton
          title="تسجيل الدخول"
          onPress={handleLogin}
          loading={isLoading}
          variant="primary"
          size="large"
        />
      </View>
    </ScreenTransition>
  );
}
```

### مثال 2: قائمة بحركة Staggered

```tsx
import { AnimatedCard } from '@/components/ui';

{medications.map((med, index) => (
  <AnimatedCard
    key={med.id}
    delay={index * 100}  // كل كارت له تأخير 100ms
    onPress={() => handleMedicationPress(med)}
  >
    <Text>{med.name}</Text>
    <Text>{med.dosage}</Text>
  </AnimatedCard>
))}
```

### مثال 3: شاشة ملف شخصي كاملة

```tsx
import {
  Section,
  ProgressIndicator,
  AnimatedCard,
  AnimatedButton,
  ScreenTransition,
} from '@/components/ui';

export default function ProfileScreen() {
  return (
    <ScreenTransition>
      <ScrollView>
        <Section
          title="تقدم الحمل"
          subtitle="الأسبوع الحالي"
          variant="card"
          delay={0}
        >
          <ProgressIndicator
            currentWeek={currentWeek}
            totalWeeks={40}
          />
        </Section>

        <Section
          title="معلومات سريعة"
          variant="card"
          delay={100}
        >
          <AnimatedCard delay={0} pressable={false}>
            <Text>عدد الأدوية: 5</Text>
          </AnimatedCard>
        </Section>

        <AnimatedButton
          title="تسجيل الخروج"
          onPress={handleLogout}
          variant="outline"
          size="medium"
        />
      </ScrollView>
    </ScreenTransition>
  );
}
```

---

## الألوان المستخدمة

```javascript
const COLORS = {
  primary: '#E91E63',      // وردي رئيسي
  secondary: '#F8BBD0',    // وردي فاتح
  accent: '#C2185B',       // وردي غامق
  text: '#1A1A1A',         // نص رئيسي
  textSecondary: '#666666', // نص ثانوي
  background: '#F5F7FA',   // خلفية
  white: '#FFFFFF',
};
```

---

## ملاحظات مهمة

1. **Haptic Feedback**: كل الأزرار والكروت القابلة للضغط تستخدم Haptic Feedback لتحسين تجربة المستخدم

2. **الأداء**: جميع الحركات مُحسّنة باستخدام `react-native-reanimated` لضمان 60fps

3. **Accessibility**: جميع المكونات تدعم Accessibility للمستخدمين ذوي الاحتياجات الخاصة

4. **RTL Support**: المكونات تعمل بشكل صحيح مع اللغة العربية والتخطيط RTL

5. **TypeScript**: جميع المكونات مكتوبة بالكامل بـ TypeScript مع دعم كامل للـ types

---

## شاشة العرض التوضيحية

يمكنك رؤية جميع المكونات في العمل من خلال شاشة العرض التوضيحية:

```
app/(tabs)/demo-ui.tsx
```

هذه الشاشة تعرض جميع المكونات مع أمثلة حية على استخدامها.

---

## التطوير المستقبلي

- إضافة مكونات جديدة (BottomSheet، Modal، Toast)
- تحسين الحركات مع المزيد من الخيارات
- إضافة Dark Mode
- دعم Themes قابلة للتخصيص

---

تم التطوير بواسطة فريق HamlyMD 💝

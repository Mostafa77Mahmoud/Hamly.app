export interface SlideData {
  id: string;
  key: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  gradientColors: string[];
}

export const onboardingSlides: SlideData[] = [
  {
    id: 'welcome-1',
    key: 'welcome',
    titleKey: 'onboardingWelcomeTitle',
    subtitleKey: 'onboardingWelcomeSubtitle',
    descriptionKey: 'onboardingWelcomeDescription',
    gradientColors: ['#FFFFFF', '#FFF5F8', '#F5F5F5'],
  },
  {
    id: 'welcome-2',
    key: 'labs',
    titleKey: 'onboardingLabsTitle',
    subtitleKey: 'onboardingLabsSubtitle',
    descriptionKey: 'onboardingLabsDescription',
    gradientColors: ['#FFFFFF', '#E8F4F8', '#F5F5F5'],
  },
  {
    id: 'welcome-3',
    key: 'medications',
    titleKey: 'onboardingMedsTitle',
    subtitleKey: 'onboardingMedsSubtitle',
    descriptionKey: 'onboardingMedsDescription',
    gradientColors: ['#FFFFFF', '#E8F8ED', '#F5F5F5'],
  },
  {
    id: 'welcome-4',
    key: 'health',
    titleKey: 'onboardingHealthTitle',
    subtitleKey: 'onboardingHealthSubtitle',
    descriptionKey: 'onboardingHealthDescription',
    gradientColors: ['#FFFFFF', '#FFF9E8', '#F5F5F5'],
  },
  {
    id: 'welcome-5',
    key: 'final',
    titleKey: 'onboardingFinalTitle',
    subtitleKey: 'onboardingFinalSubtitle',
    descriptionKey: 'onboardingFinalDescription',
    gradientColors: ['#FFFFFF', '#FFF5F8', '#F5F5F5'],
  },
];

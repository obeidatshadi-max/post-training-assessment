const QUESTIONS = [
  {
    id: 'q1',
    en: 'What do we mean by selling?',
    ar: 'ماذا نقصد بالبيع؟',
    options: [
      { key: 'a', en: 'Building a long-term relationship', ar: 'بناء علاقة طويلة المدى' },
      { key: 'b', en: 'A transaction between two parties', ar: 'معاملة تجارية بين طرفين' },
      { key: 'c', en: 'Giving free samples to doctors', ar: 'تقديم عينات مجانية للأطباء' },
      { key: 'd', en: 'Presenting product features', ar: 'عرض مزايا المنتج' }
    ],
    correct: 'b'
  },
  {
    id: 'q2',
    en: 'What do we mean by partnership?',
    ar: 'ماذا نقصد بالشراكة؟',
    options: [
      { key: 'a', en: 'Selling the most units possible', ar: 'بيع أكبر كمية ممكنة من المنتجات' },
      { key: 'b', en: 'A one-time agreement', ar: 'اتفاقية لمرة واحدة' },
      { key: 'c', en: 'Discounting products to keep clients', ar: 'تخفيض الأسعار للحفاظ على العملاء' },
      { key: 'd', en: 'Equal benefits for both sides over a long time', ar: 'منافع متساوية لكلا الطرفين على المدى الطويل' }
    ],
    correct: 'd'
  },
  {
    id: 'q3',
    en: 'What does a medical representative sell?',
    ar: 'ماذا يبيع المندوب الطبي؟',
    options: [
      { key: 'a', en: 'Products and medicines', ar: 'المنتجات والأدوية' },
      { key: 'b', en: 'Promotions and discounts', ar: 'العروض والتخفيضات' },
      { key: 'c', en: 'Solutions to customer problems', ar: 'حلولاً لمشاكل العميل' },
      { key: 'd', en: 'Company reputation', ar: 'سمعة الشركة' }
    ],
    correct: 'c'
  },
  {
    id: 'q4',
    en: 'How do we gain customer confidence?',
    ar: 'كيف نكسب ثقة العميل؟',
    options: [
      { key: 'a', en: 'By offering the lowest price', ar: 'بتقديم أقل الأسعار' },
      { key: 'b', en: 'By giving more samples', ar: 'بإعطاء المزيد من العينات' },
      { key: 'c', en: 'By knowing all product details', ar: 'بمعرفة جميع تفاصيل المنتج' },
      { key: 'd', en: 'Through repetition and consistency', ar: 'من خلال التكرار والاتساق' }
    ],
    correct: 'd'
  },
  {
    id: 'q5',
    en: 'What are the characteristics of a strategic objective?',
    ar: 'ما هي خصائص الهدف الاستراتيجي؟',
    options: [
      { key: 'a', en: 'Simple, Fast, Flexible, Realistic, Tracked', ar: 'بسيط، سريع، مرن، واقعي، قابل للتتبع' },
      { key: 'b', en: 'Specific, Modern, Achievable, Realistic, Transparent', ar: 'محدد، حديث، قابل للتحقيق، واقعي، شفاف' },
      { key: 'c', en: 'Strong, Measurable, Active, Reliable, Timed', ar: 'قوي، قابل للقياس، نشط، موثوق، محدد بوقت' },
      { key: 'd', en: 'Specific, Measurable, Achievable, Relevant, Time-bound (SMART)', ar: 'محدد، قابل للقياس، قابل للتحقيق، ذو صلة، محدد بوقت (SMART)' }
    ],
    correct: 'd'
  },
  {
    id: 'q6',
    en: 'What is the most important external data we need to know?',
    ar: 'ما هي أهم البيانات الخارجية التي نحتاج لمعرفتها؟',
    options: [
      { key: 'a', en: 'Customer needs', ar: 'احتياجات العميل' },
      { key: 'b', en: 'Number of patients per doctor', ar: 'عدد المرضى لدى الطبيب' },
      { key: 'c', en: 'Competitor information', ar: 'معلومات المنافس' },
      { key: 'd', en: 'Social style of the customer', ar: 'الأسلوب الاجتماعي للعميل' }
    ],
    correct: 'c'
  },
  {
    id: 'q7',
    en: 'What is the golden rule in impactful communication?',
    ar: 'ما هي القاعدة الذهبية في التواصل المؤثر؟',
    options: [
      { key: 'a', en: 'Speak clearly and slowly', ar: 'التحدث بوضوح وببطء' },
      { key: 'b', en: 'Always smile and be polite', ar: 'الابتسام دائماً والتحلي باللباقة' },
      { key: 'c', en: 'Ask many questions', ar: 'طرح أسئلة كثيرة' },
      { key: 'd', en: 'Find common things with the other person', ar: 'إيجاد أوجه مشتركة مع الشخص الآخر' }
    ],
    correct: 'd'
  },
  {
    id: 'q8',
    en: 'What are the percentages of influence: words, tone, body language?',
    ar: 'ما نسب التأثير: الكلمات، النبرة، لغة الجسد؟',
    options: [
      { key: 'a', en: '30%, 30%, 40%', ar: '30%، 30%، 40%' },
      { key: 'b', en: '20%, 40%, 40%', ar: '20%، 40%، 40%' },
      { key: 'c', en: '15%, 25%, 60%', ar: '15%، 25%، 60%' },
      { key: 'd', en: '7%, 38%, 55%', ar: '7%، 38%، 55%' }
    ],
    correct: 'd'
  },
  {
    id: 'q9',
    en: 'How does harmony in communication increase our influence?',
    ar: 'كيف يزيد الانسجام في التواصل من تأثيرنا؟',
    options: [
      { key: 'a', en: 'By speaking faster and with more energy', ar: 'بالتحدث بسرعة أكبر وبطاقة أعلى' },
      { key: 'b', en: 'By repeating key messages three times', ar: 'بتكرار الرسائل الرئيسية ثلاث مرات' },
      { key: 'c', en: 'By using formal language and titles', ar: 'باستخدام لغة رسمية وألقاب' },
      { key: 'd', en: 'By aligning words, tone, and body language together', ar: 'بمواءمة الكلمات والنبرة ولغة الجسد معاً' }
    ],
    correct: 'd'
  },
  {
    id: 'q10',
    en: 'What does an objection from a customer mean?',
    ar: 'ماذا يعني اعتراض العميل؟',
    options: [
      { key: 'a', en: 'The customer is not interested', ar: 'العميل غير مهتم' },
      { key: 'b', en: 'The customer wants a discount', ar: 'العميل يريد تخفيضاً' },
      { key: 'c', en: 'The visit has failed', ar: 'الزيارة قد فشلت' },
      { key: 'd', en: 'An opportunity to understand and respond', ar: 'فرصة للفهم والرد' }
    ],
    correct: 'd'
  },
  {
    id: 'q11',
    en: 'What is the first step to handle an objection?',
    ar: 'ما هي الخطوة الأولى للتعامل مع الاعتراض؟',
    options: [
      { key: 'a', en: 'Immediately provide more product information', ar: 'تقديم معلومات إضافية عن المنتج فوراً' },
      { key: 'b', en: 'Apologize and offer a solution', ar: 'الاعتذار وتقديم حل' },
      { key: 'c', en: 'Agree with the customer and move on', ar: 'الموافقة مع العميل والمضي قدماً' },
      { key: 'd', en: 'Ask a question to clarify the objection', ar: 'طرح سؤال لتوضيح الاعتراض' }
    ],
    correct: 'd'
  },
  {
    id: 'q12',
    en: 'Why do you need to know the social style of a customer?',
    ar: 'لماذا تحتاج إلى معرفة الأسلوب الاجتماعي للعميل؟',
    options: [
      { key: 'a', en: 'To decide how long the visit should be', ar: 'لتحديد مدة الزيارة' },
      { key: 'b', en: 'To know what products to bring', ar: 'لمعرفة المنتجات التي تحضرها' },
      { key: 'c', en: 'To determine their budget level', ar: 'لتحديد مستوى ميزانيتهم' },
      { key: 'd', en: 'To provide effective tailored solutions', ar: 'لتقديم حلول فعّالة ومخصصة' }
    ],
    correct: 'd'
  }
];

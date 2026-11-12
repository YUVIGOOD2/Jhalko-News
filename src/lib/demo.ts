import type { Article, Category } from './types';

// Jab tak Supabase connect nahi hota, site in demo khabron se chalti hai.
export const demoCategories: Category[] = [
  { id: 1, name: 'सीकर', slug: 'sikar', sort_order: 1 },
  { id: 2, name: 'राजस्थान', slug: 'rajasthan', sort_order: 2 },
  { id: 3, name: 'देश', slug: 'desh', sort_order: 3 },
  { id: 4, name: 'राजनीति', slug: 'rajniti', sort_order: 4 },
  { id: 5, name: 'क्राइम', slug: 'crime', sort_order: 5 },
  { id: 6, name: 'खेल', slug: 'khel', sort_order: 6 },
  { id: 7, name: 'शिक्षा', slug: 'shiksha', sort_order: 7 },
  { id: 8, name: 'मनोरंजन', slug: 'manoranjan', sort_order: 8 },
];

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600_000).toISOString();

const raw: Array<[string, number, string, boolean, boolean, number]> = [
  ['सीकर में नई सड़क परियोजना को मंजूरी, शहर को मिलेगा जाम से छुटकारा', 1, 'नगर परिषद ने 12 करोड़ की लागत से नई सड़क परियोजना को हरी झंडी दी।', true, true, 1],
  ['शेखावाटी में बारिश का अलर्ट, मौसम विभाग ने जारी की चेतावनी', 2, 'अगले 48 घंटों में सीकर, झुंझुनू और चूरू में तेज बारिश की संभावना।', true, false, 2],
  ['राज्य सरकार ने किसानों के लिए नई योजना की घोषणा की', 2, 'योजना के तहत छोटे किसानों को सिंचाई उपकरणों पर सब्सिडी मिलेगी।', false, true, 4],
  ['जिला स्तरीय खेल प्रतियोगिता में सीकर के खिलाड़ियों का दबदबा', 6, 'कबड्डी और एथलेटिक्स में सीकर टीम ने 9 स्वर्ण पदक जीते।', false, false, 6],
  ['बोर्ड परीक्षा की तारीखें घोषित, छात्र ऐसे करें तैयारी', 7, 'माध्यमिक शिक्षा बोर्ड ने परीक्षा कार्यक्रम जारी किया।', false, false, 8],
  ['संसद के शीतकालीन सत्र में कई अहम बिल होंगे पेश', 3, 'सत्र में शिक्षा और डिजिटल सुरक्षा से जुड़े विधेयक चर्चा में रहेंगे।', false, false, 10],
  ['नगर निकाय चुनाव की तैयारियां तेज, पार्टियों ने बनाई रणनीति', 4, 'सभी प्रमुख दलों ने वार्ड स्तर पर बैठकें शुरू कीं।', false, false, 12],
  ['पुलिस ने चोरी गिरोह का किया पर्दाफाश, तीन आरोपी गिरफ्तार', 5, 'आरोपियों से चोरी की 7 बाइक बरामद की गईं।', true, false, 14],
  ['राजस्थानी फिल्म की शूटिंग सीकर में, लोकल कलाकारों को मौका', 8, 'फिल्म की टीम ने स्थानीय कलाकारों के लिए ऑडिशन रखे।', false, false, 20],
];

export const demoArticles: Article[] = raw.map(([title, cat, summary, breaking, featured, hrs], i) => {
  const c = demoCategories.find((x) => x.id === cat)!;
  return {
    id: `demo-${i}`,
    title,
    slug: `demo-news-${i}`,
    summary,
    body: `${summary}\n\nयह एक डेमो खबर है। Supabase कनेक्ट करने के बाद असली खबरें यहां दिखेंगी।\n\n## पूरी जानकारी\n\nस्टाफ पैनल से रिपोर्टर खबर लिखेंगे, एडमिन उसे चेक करके पब्लिश करेगा। हर खबर में फोटो, वीडियो, टैग और कैटेगरी जोड़ी जा सकती है।\n\n> झलको न्यूज़ – सीकर की हर खबर, सबसे पहले।`,
    cover_url: null,
    video_url: i === 1 ? 'https://www.youtube.com/watch?v=ysz5S6PUM-U' : null,
    category_id: cat,
    tags: ['सीकर', c.name],
    author_name: 'Jhalko News Desk',
    status: 'published',
    is_breaking: breaking,
    is_featured: featured,
    location: 'सीकर',
    views: 5000 - i * 430,
    published_at: h(hrs),
    created_at: h(hrs),
    updated_at: h(hrs),
    categories: { name: c.name, slug: c.slug },
  };
});

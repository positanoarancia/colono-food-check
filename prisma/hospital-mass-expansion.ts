type FoodEntry = {
  name: string;
  aliases?: string[];
  tags?: string[];
  description?: string;
};

type Catalog = {
  prefix: string;
  groupId: string;
  items: FoodEntry[];
};

const item = (
  name: string,
  aliases: string[] = [],
  tags: string[] = [],
  description?: string,
): FoodEntry => ({
  name,
  aliases,
  tags,
  description,
});

const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const autoAliases = (name: string) => {
  const aliases = new Set<string>();

  if (name.includes("스파게티")) aliases.add(name.replaceAll("스파게티", "파스타"));
  if (name.includes("파스타")) aliases.add(name.replaceAll("파스타", "스파게티"));
  if (name.includes("돈까스")) aliases.add(name.replaceAll("돈까스", "돈가스"));
  if (name.includes("돈가스")) aliases.add(name.replaceAll("돈가스", "돈까스"));
  if (name.includes("오뎅")) aliases.add(name.replaceAll("오뎅", "어묵"));
  if (name.includes("어묵")) aliases.add(name.replaceAll("어묵", "오뎅"));
  if (name.includes("주꾸미")) aliases.add(name.replaceAll("주꾸미", "쭈꾸미"));
  if (name.includes("쭈꾸미")) aliases.add(name.replaceAll("쭈꾸미", "주꾸미"));
  if (name.includes("자장")) aliases.add(name.replaceAll("자장", "짜장"));
  if (name.includes("짜장")) aliases.add(name.replaceAll("짜장", "자장"));
  if (name.includes("샐러드")) aliases.add(name.replaceAll("샐러드", "셀러드"));

  aliases.delete(name);
  return Array.from(aliases);
};

const makeCatalog = (
  prefix: string,
  groupId: string,
  entries: Array<string | FoodEntry>,
): Catalog => ({
  prefix,
  groupId,
  items: entries.map((entry) => {
    if (typeof entry === "string") {
      return item(entry, autoAliases(entry));
    }

    return item(
      entry.name,
      uniq([...(entry.aliases ?? []), ...autoAliases(entry.name)]),
      entry.tags ?? [],
      entry.description,
    );
  }),
});

const combineMenus = (bases: string[], suffixes: string[]) =>
  bases.flatMap((base) => suffixes.map((suffix) => `${base}${suffix}`));

const directWholeGrainFoods = [
  item("깨죽", [], ["tag_nuts", "tag_whole_grain"], "서울성모병원 안내문에 직접 언급된 제한 음식"),
  item("검은깨죽", [], ["tag_nuts", "tag_whole_grain"]),
];

const directOilyFoods = [
  item("들기름", [], ["tag_processed"], "기름진 조미 재료는 보수적으로 본다"),
];

const directLeafyFoods = [
  item("미나리", [], ["tag_high_fiber", "tag_vegetables_heavy"]),
];

const directMushroomFoods = [
  item("버섯류", [], ["tag_high_fiber", "tag_vegetables_heavy"]),
  item("버섯", [], ["tag_high_fiber", "tag_vegetables_heavy"]),
];

const directBeanFoods = [
  item("콩", [], ["tag_high_fiber"]),
  item("콩류", [], ["tag_high_fiber"]),
];

const directKimchiFoods = [
  item("김치류", [], ["tag_spicy", "tag_vegetables_heavy", "tag_chunky"]),
];

const directMeatFoods = [
  item("고기류", [], ["tag_processed"]),
];

const directSeaweedFoods = [
  item("해조류", [], ["tag_seaweed", "tag_high_fiber"]),
];

const directSeededFoods = [
  item("고추씨", [], ["tag_seeded", "tag_high_fiber"]),
];

const directRootStarchFoods = [
  item("옥수수", [], ["tag_seeded", "tag_high_fiber"]),
];

const directBreadFoods = [
  item("빵종류", ["빵류"], ["tag_low_fiber"]),
];

const directSoftProteinFoods = [
  item("계란류", [], ["tag_soft", "tag_low_fiber"]),
  item("두부류", [], ["tag_soft", "tag_low_fiber"]),
  item("생선", [], ["tag_soft", "tag_low_fiber"]),
];

const directLiquidFoods = [
  item("국물류", [], ["tag_clear_broth"]),
  item("건더기없는국물", ["건더기 없는 국물", "건더기없는 국물류"], ["tag_clear_broth"]),
  item("맑은음료류", ["맑은 음료류", "맑은음료"], ["tag_clear_broth"]),
  item("녹차", [], ["tag_clear_broth"]),
  item("이온음료", [], ["tag_clear_broth"]),
];

const directSoftFruitFoods = [
  item("사과배바나나", ["사과 배 바나나"], ["tag_soft"]),
];

const kimchiNames = [
  "배추김치", "포기김치", "맛김치", "썰은김치", "총각김치", "깍두기", "석박지", "열무김치", "열무물김치",
  "파김치", "갓김치", "오이소박이", "고들빼기김치", "부추김치", "백김치", "보쌈김치", "나박김치",
  "동치미", "묵은지", "얼갈이김치", "알타리김치", "쪽파김치", "양배추김치", "부추겉절이",
];

const mushroomNames = [
  "표고버섯", "느타리버섯", "새송이버섯", "팽이버섯", "양송이버섯", "목이버섯", "만가닥버섯", "송이버섯",
  "백만송이버섯", "노루궁뎅이버섯", "황금팽이버섯", "갈색팽이버섯", "참송이버섯", "흰목이버섯",
  "능이버섯", "영지버섯", "버들송이버섯", "들깨버섯",
];

const beanNames = [
  "검은콩", "서리태", "강낭콩", "병아리콩", "완두콩", "렌틸콩", "백태", "청태", "완두", "대두", "쥐눈이콩", "적두",
  "팥", "녹두", "메주콩", "삶은콩", "볶은콩",
];

const leafyNames = [
  "미나리", "상추", "양상추", "시금치", "부추", "깻잎", "쑥갓", "열무", "얼갈이", "배추", "양배추", "청경채",
  "케일", "근대", "아욱", "돌나물", "취나물", "고사리", "도라지", "숙주", "콩나물", "브로콜리", "셀러리",
  "파채", "쪽파", "대파", "냉이", "달래", "봄동", "치커리", "비트잎", "로메인", "쌈추", "비름나물",
  "공심채", "청상추", "적상추", "치커리잎", "무청", "시래기",
];

const seededProduce = [
  "토마토", "방울토마토", "대추방울토마토", "완숙토마토", "참외", "수박", "딸기", "포도", "청포도", "적포도",
  "거봉", "블루베리", "라즈베리", "블랙베리", "석류", "키위", "황금키위", "청양고추", "풋고추", "홍고추",
  "꽈리고추", "파프리카", "피망", "옥수수", "초당옥수수", "찰옥수수",
];

const grainNames = [
  "깨죽", "검은깨죽", "들깨죽", "귀리밥", "보리밥", "기장밥", "수수밥", "차조밥", "율무밥", "현미죽", "잡곡죽",
  "오곡죽", "흑미죽", "퀴노아밥", "귀리죽", "보리죽", "들깨수제비", "들깨칼국수", "메밀묵", "메밀전병",
  "메밀국수", "메밀소바", "통밀빵", "호밀빵", "잡곡식빵", "씨앗빵",
];

const oilSeasoningNames = [
  "들기름", "참기름", "참깨드레싱", "들깨드레싱", "깨소스", "마요네즈", "들깨가루", "참깨", "검은깨", "깨소금",
  "견과드레싱", "참깨소스", "흑임자소스", "흑임자드레싱", "들깨탕", "참깨죽",
];

const kimchiDishes = uniq([
  ...kimchiNames,
  ...kimchiNames.map((name) => `${name}볶음`),
  ...kimchiNames.map((name) => `${name}무침`),
  ...kimchiNames.map((name) => `${name}전`),
  ...kimchiNames.map((name) => `${name}덮밥`),
  ...kimchiNames.map((name) => `${name}주먹밥`),
  ...kimchiNames.map((name) => `${name}국수`),
]);

const mushroomDishes = uniq([
  ...mushroomNames,
  ...mushroomNames.map((name) => `${name}볶음`),
  ...mushroomNames.map((name) => `${name}구이`),
  ...mushroomNames.map((name) => `${name}무침`),
  ...mushroomNames.map((name) => `${name}나물`),
  ...mushroomNames.map((name) => `${name}전골`),
  ...mushroomNames.map((name) => `${name}국`),
  ...mushroomNames.map((name) => `${name}죽`),
  ...mushroomNames.map((name) => `${name}덮밥`),
  ...mushroomNames.map((name) => `${name}볶음밥`),
]);

const beanDishes = uniq([
  ...beanNames,
  ...beanNames.map((name) => `${name}밥`),
  ...beanNames.map((name) => `${name}죽`),
  ...beanNames.map((name) => `${name}샐러드`),
  ...beanNames.map((name) => `${name}조림`),
  ...beanNames.map((name) => `${name}자반`),
  ...beanNames.map((name) => `${name}국`),
  ...beanNames.map((name) => `${name}수프`),
  ...beanNames.map((name) => `${name}볶음`),
  ...beanNames.map((name) => `${name}두유`),
  "콩국", "콩국수", "서리태콩국수", "검은콩국수", "콩조림", "콩나물국", "콩비지찌개", "청국장", "된장국",
  "된장찌개", "순두부찌개", "콩자반", "두유", "검은콩두유", "서리태두유",
]);

const leafyDishes = uniq([
  ...leafyNames,
  ...leafyNames.map((name) => `${name}무침`),
  ...leafyNames.map((name) => `${name}나물`),
  ...leafyNames.map((name) => `${name}겉절이`),
  ...leafyNames.map((name) => `${name}볶음`),
  ...leafyNames.map((name) => `${name}국`),
  ...leafyNames.map((name) => `${name}샐러드`),
  ...leafyNames.map((name) => `${name}비빔밥`),
]);

const seededProduceDishes = uniq([
  ...seededProduce,
  ...seededProduce.map((name) => `${name}샐러드`),
  ...seededProduce.map((name) => `${name}주스`),
  ...seededProduce.map((name) => `${name}스무디`),
  ...seededProduce.map((name) => `${name}볶음`),
  ...seededProduce.map((name) => `${name}무침`),
]);

const grainDishes = uniq([
  ...grainNames,
  ...grainNames.map((name) => `${name}정식`),
  ...grainNames.map((name) => `${name}한상`),
  ...grainNames.map((name) => `${name}주먹밥`),
  ...grainNames.map((name) => `${name}샐러드`),
]);

const clearSoupBases = ["설렁탕", "곰탕", "갈비탕", "도가니탕", "소머리국밥", "돼지국밥", "순대국", "닭곰탕", "삼계탕", "백숙", "오리탕", "떡국", "만둣국", "북엇국", "황태국", "콩나물국밥", "우거지국", "시래기국", "버섯국", "육개장", "감자탕", "해장국", "추어탕", "매운탕", "알탕", "동태탕", "대구탕", "어묵탕", "샤브샤브", "전골"];
const brothVariants = ["", "정식", "특", "한그릇", "뚝배기", "백반", "사리", "곱빼기"];
const brothMeals = uniq([...clearSoupBases, ...clearSoupBases.flatMap((base) => brothVariants.map((suffix) => `${base}${suffix}`))]);

const pastaProteins = ["새우", "치킨", "베이컨", "버섯", "명란", "해물", "소고기", "불고기", "미트볼", "갈릭", "바질", "크랩", "연어", "참치", "오징어", "관자"];
const tomatoStyles = ["토마토", "로제", "아라비아따", "볼로네제", "나폴리탄", "오일", "봉골레", "페스토"];
const creamStyles = ["크림", "치즈", "까르보나라", "알프레도", "투움바"];
const pastaNames = uniq([
  ...pastaProteins.flatMap((protein) => tomatoStyles.map((style) => `${protein}${style}파스타`)),
  ...pastaProteins.flatMap((protein) => creamStyles.map((style) => `${protein}${style}파스타`)),
  ...pastaProteins.flatMap((protein) => tomatoStyles.map((style) => `${protein}${style}스파게티`)),
  ...pastaProteins.flatMap((protein) => creamStyles.map((style) => `${protein}${style}스파게티`)),
  ...pastaProteins.flatMap((protein) => ["리조또", "로제리조또", "크림리조또"].map((style) => `${protein}${style}`)),
]);

const noodleBases = ["칼국수", "국수", "비빔국수", "냉면", "우동", "소바", "쫄면", "막국수", "라면", "수제비"];
const noodleToppings = ["해물", "닭", "바지락", "멸치", "들깨", "김치", "고기", "버섯", "어묵", "매운", "얼큰", "비빔", "물", "차돌", "새우", "오징어"];
const noodleNames = uniq([
  ...noodleBases,
  ...noodleToppings.flatMap((top) => noodleBases.map((base) => `${top}${base}`)),
  ...["물", "비빔", "들기름", "열무", "동치미", "회", "김치", "육전"].flatMap((top) => ["냉면", "막국수", "소바"].map((base) => `${top}${base}`)),
]);

const riceProteins = ["치킨", "새우", "연어", "참치", "불고기", "소불고기", "제육", "닭갈비", "오징어", "낙지", "주꾸미", "마파두부", "고등어", "장어", "규", "부타", "스팸", "삼겹", "소고기", "버섯", "계란", "새송이", "김치", "카레", "돈까스", "텐동", "새우튀김", "닭다리살", "훈제오리", "차슈"];
const riceSuffixes = ["덮밥", "마요덮밥", "비빔덮밥", "정식"];
const riceBowlNames = uniq([
  ...riceProteins.flatMap((protein) => riceSuffixes.map((suffix) => `${protein}${suffix}`)),
  ...["카레라이스", "하이라이스", "오므라이스", "규동", "부타동", "가츠동", "텐동", "돈부리", "장어덮밥", "알밥", "회덮밥"],
]);

const friedRiceToppings = ["김치", "새우", "치킨", "햄", "베이컨", "버섯", "계란", "참치", "날치알", "갈릭", "불고기", "제육", "닭갈비", "소고기", "해물", "오징어", "낙지", "카레", "야채", "차슈"];
const friedRiceNames = uniq([
  ...friedRiceToppings.flatMap((top) => ["볶음밥", "필라프", "리조또"].map((base) => `${top}${base}`)),
  "볶음밥", "필라프", "리조또", "김치볶음밥", "새우볶음밥", "계란볶음밥",
]);

const meatBases = ["불고기", "갈비", "삼겹살", "목살", "항정살", "수육", "보쌈", "편육", "장조림", "스테이크", "닭구이", "오리구이", "훈제오리", "햄구이", "소시지구이", "떡갈비", "함박스테이크", "양념갈비", "닭다리구이", "닭안심구이", "제육", "차슈", "LA갈비", "돼지갈비", "소갈비"];
const meatSuffixes = ["", "정식", "구이", "볶음", "덮밥", "백반"];
const meatNames = uniq([...meatBases, ...meatBases.flatMap((base) => meatSuffixes.map((suffix) => `${base}${suffix}`))]);

const spicyBases = ["제육", "닭갈비", "오징어", "낙지", "주꾸미", "쭈꾸미", "곱창", "야채곱창", "닭발", "무뼈닭발", "오돌뼈", "불닭", "매운갈비", "양념돼지갈비", "오삼", "순대", "떡볶이", "라볶이", "불족발", "마라", "양념게장"];
const spicySuffixes = ["볶음", "덮밥", "정식", "비빔밥", "전골"];
const spicyNames = uniq([...spicyBases, ...spicyBases.flatMap((base) => spicySuffixes.map((suffix) => `${base}${suffix}`))]);

const cutletPrefixes = ["돈까스", "치즈돈까스", "생선까스", "새우까스", "치킨까스", "안심까스", "등심까스", "왕돈까스", "고구마치즈돈까스", "카레돈까스", "경양식돈까스", "매운돈까스", "떡갈비까스"];
const cutletSuffixes = ["", "정식", "덮밥", "샌드", "버거", "플레이트"];
const cutletNames = uniq([...cutletPrefixes, ...cutletPrefixes.flatMap((base) => cutletSuffixes.map((suffix) => `${base}${suffix}`))]);

const fastfoodBases = ["치즈버거", "불고기버거", "새우버거", "치킨버거", "베이컨버거", "더블버거", "핫도그", "감자튀김", "치즈볼", "치킨너겟", "핫윙", "버팔로윙", "토르티야", "랩샌드위치", "치아바타샌드위치", "햄치즈샌드위치", "에그샌드위치", "클럽샌드위치", "피자", "조각피자", "시카고피자", "포카치아샌드위치"];
const fastfoodSuffixes = ["세트", "콤보", "정식", "플레이트"];
const fastfoodNames = uniq([...fastfoodBases, ...fastfoodBases.flatMap((base) => fastfoodSuffixes.map((suffix) => `${base}${suffix}`))]);

const breadMore = [
  "와플", "팬케이크", "핫케이크", "도넛", "도우넛", "카스테라롤", "소보로빵", "단팥빵", "크림빵", "생크림빵",
  "치즈케이크", "플레인베이글", "블루베리베이글", "잼토스트", "허니브레드", "버터토스트", "우유롤", "플레인머핀",
  "치즈머핀", "초코머핀", "쿠키슈", "모카번", "브레드스틱", "플레인스콘", "카스테라빵",
];

const snackMore = [
  "마시멜로", "요구르트젤리", "사과젤리", "복숭아젤리", "버터와플", "계란과자", "카스타드케이크", "우유푸딩",
  "초코과자", "쿠키앤크림푸딩", "화이트크래커", "버터크래커", "참붕어빵과자", "소프트쿠키", "스틱과자",
  "요거트푸딩", "플레인비스킷", "카라멜푸딩", "우유젤리", "망고푸딩",
];

const drinkMore = [
  "보리차", "옥수수차", "결명자차", "둥굴레차", "미숫가루", "두유", "검은콩두유", "서리태두유", "매실주스",
  "배주스", "복숭아주스", "망고주스", "포도에이드", "레몬에이드", "탄산음료", "사이다", "콜라", "오렌지에이드",
  "밀크티", "라떼", "카페라떼", "바닐라라떼", "초코라떼", "스무디", "과일스무디",
];

export const massFoodGroups = [
  { id: "group_kimchi_family", slug: "kimchi-family", name: "김치류", description: "배추김치, 깍두기, 열무김치처럼 김치 계열 음식", sortOrder: 35, isFallbackGroup: false },
  { id: "group_mushroom_family", slug: "mushroom-family", name: "버섯류", description: "표고, 느타리 등 버섯과 버섯 요리", sortOrder: 36, isFallbackGroup: false },
  { id: "group_bean_family", slug: "bean-family", name: "콩류", description: "콩, 팥, 두유, 콩국수 등 콩 기반 음식", sortOrder: 37, isFallbackGroup: false },
  { id: "group_leafy_veg", slug: "leafy-veg", name: "잎채소류", description: "미나리, 상추, 부추 같은 잎채소와 나물", sortOrder: 38, isFallbackGroup: false },
  { id: "group_seeded_veg", slug: "seeded-veg", name: "씨있는채소과일류", description: "토마토, 딸기, 포도, 고추, 옥수수 등 씨와 알갱이가 있는 식품", sortOrder: 39, isFallbackGroup: false },
  { id: "group_oily_seasoning", slug: "oily-seasoning", name: "기름조미류", description: "들기름, 참기름, 깨소스처럼 기름지고 조미가 강한 재료", sortOrder: 40, isFallbackGroup: false },
] as const;

export const massFoodGroupTags = [
  ["group_kimchi_family", "tag_spicy"],
  ["group_kimchi_family", "tag_vegetables_heavy"],
  ["group_kimchi_family", "tag_chunky"],
  ["group_mushroom_family", "tag_high_fiber"],
  ["group_mushroom_family", "tag_vegetables_heavy"],
  ["group_bean_family", "tag_high_fiber"],
  ["group_leafy_veg", "tag_high_fiber"],
  ["group_leafy_veg", "tag_vegetables_heavy"],
  ["group_leafy_veg", "tag_namul"],
  ["group_seeded_veg", "tag_seeded"],
  ["group_seeded_veg", "tag_high_fiber"],
  ["group_seeded_veg", "tag_vegetables_heavy"],
  ["group_oily_seasoning", "tag_processed"],
] as const;

export const massBulkFoodCatalogs = [
  makeCatalog("hospital_direct_grain", "group_whole_grain", directWholeGrainFoods),
  makeCatalog("hospital_direct_oily", "group_oily_seasoning", directOilyFoods),
  makeCatalog("hospital_direct_leafy", "group_leafy_veg", directLeafyFoods),
  makeCatalog("hospital_direct_mushroom", "group_mushroom_family", directMushroomFoods),
  makeCatalog("hospital_direct_bean", "group_bean_family", directBeanFoods),
  makeCatalog("hospital_direct_kimchi", "group_kimchi_family", directKimchiFoods),
  makeCatalog("hospital_direct_meat", "group_meat_dish", directMeatFoods),
  makeCatalog("hospital_direct_seaweed", "group_seaweed", directSeaweedFoods),
  makeCatalog("hospital_direct_seeded", "group_seeded_veg", directSeededFoods),
  makeCatalog("hospital_direct_root_starch", "group_root_starch", directRootStarchFoods),
  makeCatalog("hospital_direct_bread", "group_bread", directBreadFoods),
  makeCatalog("hospital_direct_soft_protein", "group_soft_protein", directSoftProteinFoods),
  makeCatalog("hospital_direct_liquid", "group_clear_liquid", directLiquidFoods),
  makeCatalog("hospital_direct_soft_fruit", "group_soft_fruit", directSoftFruitFoods),
  makeCatalog("kimchi_family", "group_kimchi_family", kimchiDishes),
  makeCatalog("mushroom_family", "group_mushroom_family", mushroomDishes),
  makeCatalog("bean_family", "group_bean_family", beanDishes),
  makeCatalog("leafy_veg_family", "group_leafy_veg", leafyDishes),
  makeCatalog("seeded_family", "group_seeded_veg", seededProduceDishes),
  makeCatalog("grain_family", "group_whole_grain", grainDishes.map((name) =>
    name.includes("들깨") || name.includes("깨")
      ? item(name, [], ["tag_nuts", "tag_whole_grain"])
      : name.includes("메밀")
        ? item(name, [], ["tag_whole_grain"])
        : item(name)
  )),
  makeCatalog("oily_family", "group_oily_seasoning", oilSeasoningNames.map((name) => item(name, [], ["tag_processed"]))),
  makeCatalog("broth_family", "group_broth_meal", brothMeals.map((name) =>
    /육개장|감자탕|해장국|매운탕|알탕/.test(name)
      ? item(name, [], ["tag_spicy"])
      : /콩나물|우거지|시래기|버섯/.test(name)
        ? item(name, [], ["tag_vegetables_heavy"])
        : item(name)
  )),
  makeCatalog("pasta_mass", "group_pasta_sauced", pastaNames.map((name) =>
    /크림|치즈|까르보나라|알프레도|투움바/.test(name)
      ? item(name, [], ["tag_dairy"])
      : /아라비아따/.test(name)
        ? item(name, [], ["tag_spicy"])
        : item(name)
  )),
  makeCatalog("noodle_mass", "group_mixed_noodle", noodleNames.map((name) =>
    /비빔|매운|얼큰|김치/.test(name)
      ? item(name, [], ["tag_spicy"])
      : /메밀|소바/.test(name)
        ? item(name, [], ["tag_whole_grain"])
        : /들기름/.test(name)
          ? item(name, [], ["tag_processed"])
          : item(name)
  )),
  makeCatalog("rice_bowl_mass", "group_rice_bowl", riceBowlNames.map((name) =>
    /마요|돈까스|텐동|튀김/.test(name)
      ? item(name, [], ["tag_processed"])
      : /제육|닭갈비|낙지|주꾸미|쭈꾸미|마파두부|김치/.test(name)
        ? item(name, [], ["tag_spicy"])
        : item(name)
  )),
  makeCatalog("fried_rice_mass", "group_fried_rice", friedRiceNames.map((name) =>
    /김치|제육|닭갈비/.test(name)
      ? item(name, [], ["tag_spicy"])
      : item(name)
  )),
  makeCatalog("meat_mass", "group_meat_dish", meatNames.map((name) =>
    /볶음/.test(name)
      ? item(name, [], ["tag_spicy"])
      : item(name)
  )),
  makeCatalog("spicy_mass", "group_spicy_stirfry", spicyNames.map((name) => item(name, [], ["tag_spicy"]))),
  makeCatalog("cutlet_mass", "group_cutlet", cutletNames.map((name) => item(name, [], ["tag_fried", "tag_processed"]))),
  makeCatalog("fastfood_mass", "group_fastfood", fastfoodNames.map((name) =>
    /피자|버거|핫도그|튀김|너겟|윙/.test(name)
      ? item(name, [], ["tag_fried", "tag_processed"])
      : item(name, [], ["tag_processed"])
  )),
  makeCatalog("bread_mass", "group_bread", breadMore),
  makeCatalog("snack_mass", "group_low_fiber_snack", snackMore),
  makeCatalog("drink_mass", "group_clear_liquid", drinkMore.map((name) =>
    /콜라|사이다|탄산|에이드|주스|라떼|스무디/.test(name)
      ? item(name, [], ["tag_processed"])
      : item(name)
  )),
] as const;

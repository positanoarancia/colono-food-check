import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");

const condition = {
  id: "cond_colonoscopy",
  slug: "colonoscopy",
  name: "대장내시경",
  description: "대장내시경 준비 단계별 음식 허용 여부를 판정하는 condition",
};

const dayStages = [
  {
    id: "stage_colonoscopy_d5",
    conditionId: condition.id,
    slug: "d5",
    name: "5일 전",
    sequence: 1,
    daysBefore: 5,
    description: "상대적으로 느슨하지만 고섬유·씨·잡곡은 줄이기 시작하는 단계",
  },
  {
    id: "stage_colonoscopy_d3",
    conditionId: condition.id,
    slug: "d3",
    name: "3일 전",
    sequence: 2,
    daysBefore: 3,
    description: "저잔사 식단 중심으로 전환하는 단계",
  },
  {
    id: "stage_colonoscopy_d1",
    conditionId: condition.id,
    slug: "d1",
    name: "1일 전",
    sequence: 3,
    daysBefore: 1,
    description: "가장 엄격한 단계로 맑은 유동식 위주로 본다",
  },
];

const foodGroups = [
  { id: "group_white_porridge", slug: "white-porridge", name: "흰죽류", description: "미음, 흰죽처럼 부드러운 죽류", sortOrder: 1 },
  { id: "group_white_rice", slug: "white-rice", name: "흰밥류", description: "흰쌀밥 기반 주식", sortOrder: 2 },
  { id: "group_clear_noodle", slug: "clear-noodle", name: "국물면류", description: "우동, 잔치국수처럼 비교적 담백한 면", sortOrder: 3 },
  { id: "group_stirfried_noodle", slug: "stirfried-noodle", name: "볶음면류", description: "볶음면과 강한 양념 면류", sortOrder: 4 },
  { id: "group_tteokbokki", slug: "tteokbokki", name: "떡볶이류", description: "떡볶이, 로제떡볶이 등 분식류", sortOrder: 5 },
  { id: "group_stew", slug: "stew", name: "찌개류", description: "김치찌개, 된장찌개 같은 찌개", sortOrder: 6 },
  { id: "group_salad", slug: "salad", name: "샐러드류", description: "생채소 기반 샐러드", sortOrder: 7 },
  { id: "group_namul", slug: "namul", name: "나물류", description: "무침/볶음 나물 반찬", sortOrder: 8 },
  { id: "group_soft_fruit", slug: "soft-fruit", name: "과일류", description: "바나나처럼 비교적 부드러운 과일", sortOrder: 9 },
  { id: "group_seeded_fruit", slug: "seeded-fruit", name: "씨있는과일류", description: "포도, 딸기처럼 씨가 많거나 표면 잔사가 남는 과일", sortOrder: 10 },
  { id: "group_nuts", slug: "nuts", name: "견과류", description: "견과와 씨앗이 많은 식품", sortOrder: 11 },
  { id: "group_seaweed", slug: "seaweed", name: "해조류", description: "김, 미역 같은 해조류", sortOrder: 12 },
  { id: "group_fried", slug: "fried", name: "튀김류", description: "튀김옷과 기름이 많은 음식", sortOrder: 13 },
  { id: "group_dairy", slug: "dairy", name: "유제품류", description: "우유, 요거트 등 유제품", sortOrder: 14 },
  { id: "group_bread", slug: "bread", name: "빵류", description: "식빵, 카스테라 등", sortOrder: 15 },
  { id: "group_convenience_rice", slug: "convenience-rice", name: "간편밥류", description: "김밥, 삼각김밥 같은 간편 밥류", sortOrder: 16 },
  { id: "group_convenience_meal", slug: "convenience-meal", name: "편의점식사류", description: "편의점 도시락 등 복합 식사", sortOrder: 17 },
  { id: "group_spicy_soup", slug: "spicy-soup", name: "자극국물류", description: "마라탕처럼 맵고 자극적인 국물 음식", sortOrder: 18 },
  { id: "group_soft_protein", slug: "soft-protein", name: "부드러운단백질류", description: "계란찜, 두부처럼 부드러운 단백질", sortOrder: 19 },
  { id: "group_low_fiber_snack", slug: "low-fiber-snack", name: "저섬유간편식류", description: "푸딩, 카스테라처럼 비교적 저섬유 간식", sortOrder: 20 },
  { id: "group_whole_grain", slug: "whole-grain", name: "잡곡밥류", description: "현미밥, 잡곡밥", sortOrder: 21 },
  { id: "group_root_starch", slug: "root-starch", name: "전분채소류", description: "감자, 고구마, 옥수수 같은 전분 채소", sortOrder: 22 },
  { id: "group_clear_liquid", slug: "clear-liquid", name: "맑은유동식류", description: "물, 맑은 육수처럼 건더기 없는 음식", sortOrder: 23 },
  { id: "group_fastfood", slug: "fastfood", name: "패스트푸드류", description: "햄버거, 피자 같은 가공 외식류", sortOrder: 24 },
].map((group) => ({ ...group, isFallbackGroup: false }));

const foodTags = [
  { id: "tag_low_fiber", slug: "low-fiber", name: "저섬유", description: "장에 남는 섬유질이 비교적 적은 음식" },
  { id: "tag_high_fiber", slug: "high-fiber", name: "고섬유", description: "잔여물이 남기 쉬운 섬유질이 많은 음식" },
  { id: "tag_seeded", slug: "seeded", name: "씨있음", description: "씨앗이나 알갱이가 많은 음식" },
  { id: "tag_with_peel", slug: "with-peel", name: "껍질있음", description: "껍질 잔사가 남기 쉬운 음식" },
  { id: "tag_whole_grain", slug: "whole-grain", name: "잡곡", description: "껍질과 배아가 남은 곡물" },
  { id: "tag_nuts", slug: "nuts", name: "견과류", description: "견과 또는 씨앗이 포함된 음식" },
  { id: "tag_seaweed", slug: "seaweed", name: "해조류", description: "김, 미역 등 질긴 섬유가 있는 해조류" },
  { id: "tag_vegetables_heavy", slug: "vegetables-heavy", name: "채소많음", description: "채소 비중이 높은 음식" },
  { id: "tag_namul", slug: "namul", name: "나물류", description: "질긴 줄기나 잎채소 반찬" },
  { id: "tag_spicy", slug: "spicy-seasoning", name: "매운양념", description: "맵고 자극적인 양념" },
  { id: "tag_fried", slug: "fried", name: "튀김", description: "튀기거나 기름 사용량이 많은 음식" },
  { id: "tag_dairy", slug: "dairy", name: "유제품", description: "우유, 요거트 등 유제품" },
  { id: "tag_soft", slug: "soft-food", name: "부드러운음식", description: "질감이 부드러워 장 부담이 적은 음식" },
  { id: "tag_clear_broth", slug: "clear-broth", name: "맑은국물", description: "건더기 없는 맑은 국물" },
  { id: "tag_chunky", slug: "chunky", name: "건더기많음", description: "건더기나 잔사가 많은 음식" },
  { id: "tag_processed", slug: "processed", name: "가공식품", description: "가공도와 조미가 높은 음식" },
  { id: "tag_red_purple", slug: "red-purple", name: "적색보라색", description: "검사 전 혼동을 줄 수 있는 색상 음식" },
];

const foodGroupTags = [
  ["group_white_porridge", "tag_low_fiber"],
  ["group_white_porridge", "tag_soft"],
  ["group_white_rice", "tag_low_fiber"],
  ["group_clear_noodle", "tag_low_fiber"],
  ["group_stirfried_noodle", "tag_processed"],
  ["group_stirfried_noodle", "tag_spicy"],
  ["group_tteokbokki", "tag_spicy"],
  ["group_tteokbokki", "tag_chunky"],
  ["group_tteokbokki", "tag_processed"],
  ["group_stew", "tag_chunky"],
  ["group_stew", "tag_vegetables_heavy"],
  ["group_salad", "tag_high_fiber"],
  ["group_salad", "tag_vegetables_heavy"],
  ["group_namul", "tag_high_fiber"],
  ["group_namul", "tag_namul"],
  ["group_namul", "tag_vegetables_heavy"],
  ["group_soft_fruit", "tag_soft"],
  ["group_seeded_fruit", "tag_seeded"],
  ["group_seeded_fruit", "tag_high_fiber"],
  ["group_seeded_fruit", "tag_red_purple"],
  ["group_nuts", "tag_nuts"],
  ["group_nuts", "tag_high_fiber"],
  ["group_seaweed", "tag_seaweed"],
  ["group_seaweed", "tag_high_fiber"],
  ["group_fried", "tag_fried"],
  ["group_fried", "tag_processed"],
  ["group_dairy", "tag_dairy"],
  ["group_dairy", "tag_soft"],
  ["group_bread", "tag_low_fiber"],
  ["group_bread", "tag_processed"],
  ["group_convenience_rice", "tag_processed"],
  ["group_convenience_rice", "tag_chunky"],
  ["group_convenience_meal", "tag_processed"],
  ["group_convenience_meal", "tag_chunky"],
  ["group_convenience_meal", "tag_vegetables_heavy"],
  ["group_spicy_soup", "tag_spicy"],
  ["group_spicy_soup", "tag_chunky"],
  ["group_soft_protein", "tag_soft"],
  ["group_soft_protein", "tag_low_fiber"],
  ["group_low_fiber_snack", "tag_low_fiber"],
  ["group_low_fiber_snack", "tag_soft"],
  ["group_low_fiber_snack", "tag_processed"],
  ["group_whole_grain", "tag_whole_grain"],
  ["group_whole_grain", "tag_high_fiber"],
  ["group_root_starch", "tag_chunky"],
  ["group_clear_liquid", "tag_clear_broth"],
  ["group_fastfood", "tag_processed"],
  ["group_fastfood", "tag_fried"],
  ["group_fastfood", "tag_chunky"],
].map(([foodGroupId, foodTagId]) => ({ foodGroupId, foodTagId, note: null }));

const makeFood = (
  id: string,
  slug: string,
  name: string,
  primaryFoodGroupId: string,
  description?: string,
  isRepresentative = false,
) => ({
  id,
  slug,
  name,
  normalizedName: normalize(name),
  primaryFoodGroupId,
  description: description ?? null,
  defaultServing: null,
  searchPriority: isRepresentative ? 100 : 0,
  isRepresentative,
});

const foods = [
  makeFood("food_white_porridge", "white-porridge", "흰죽", "group_white_porridge", "대표 허용 죽", true),
  makeFood("food_rice_gruel", "rice-gruel", "미음", "group_white_porridge"),
  makeFood("food_white_rice", "white-rice", "흰쌀밥", "group_white_rice", "대표 허용 밥", true),
  makeFood("food_steamed_egg", "steamed-egg", "계란찜", "group_soft_protein"),
  makeFood("food_boiled_egg", "boiled-egg", "삶은계란", "group_soft_protein"),
  makeFood("food_tofu", "tofu", "두부", "group_soft_protein"),
  makeFood("food_soft_tofu", "soft-tofu", "연두부", "group_soft_protein"),
  makeFood("food_potato", "potato", "감자", "group_root_starch"),
  makeFood("food_mashed_potato", "mashed-potato", "으깬감자", "group_root_starch"),
  makeFood("food_banana", "banana", "바나나", "group_soft_fruit", undefined, true),
  makeFood("food_apple", "apple", "사과", "group_soft_fruit"),
  makeFood("food_pear", "pear", "배", "group_soft_fruit"),
  makeFood("food_castella", "castella", "카스테라", "group_low_fiber_snack"),
  makeFood("food_white_bread", "white-bread", "식빵", "group_bread"),
  makeFood("food_udon", "udon", "우동", "group_clear_noodle"),
  makeFood("food_banquet_noodles", "banquet-noodles", "잔치국수", "group_clear_noodle"),
  makeFood("food_ramen", "ramen", "라면", "group_stirfried_noodle"),
  makeFood("food_kimchi_stew", "kimchi-stew", "김치찌개", "group_stew"),
  makeFood("food_soybean_stew", "soybean-stew", "된장찌개", "group_stew"),
  makeFood("food_mixed_grain_rice", "mixed-grain-rice", "잡곡밥", "group_whole_grain"),
  makeFood("food_brown_rice", "brown-rice", "현미밥", "group_whole_grain"),
  makeFood("food_gimbap", "gimbap", "김밥", "group_convenience_rice"),
  makeFood("food_bibimbap", "bibimbap", "비빔밥", "group_convenience_meal"),
  makeFood("food_tteokbokki", "tteokbokki", "떡볶이", "group_tteokbokki"),
  makeFood("food_sundae", "sundae", "순대", "group_tteokbokki"),
  makeFood("food_fried_combo", "fried-combo", "튀김", "group_fried"),
  makeFood("food_salad", "salad", "샐러드", "group_salad"),
  makeFood("food_namul", "namul", "나물반찬", "group_namul"),
  makeFood("food_sweet_potato", "sweet-potato", "고구마", "group_root_starch"),
  makeFood("food_corn", "corn", "옥수수", "group_root_starch"),
  makeFood("food_nuts", "nuts", "견과류", "group_nuts"),
  makeFood("food_almond", "almond", "아몬드", "group_nuts"),
  makeFood("food_seaweed", "seaweed", "해조류", "group_seaweed"),
  makeFood("food_seaweed_soup", "seaweed-soup", "미역국", "group_seaweed"),
  makeFood("food_kimchi", "kimchi", "김치", "group_namul"),
  makeFood("food_grape", "grape", "포도", "group_seeded_fruit"),
  makeFood("food_strawberry", "strawberry", "딸기", "group_seeded_fruit"),
  makeFood("food_watermelon", "watermelon", "수박", "group_seeded_fruit"),
  makeFood("food_coffee", "coffee", "커피", "group_clear_liquid"),
  makeFood("food_milk", "milk", "우유", "group_dairy"),
  makeFood("food_yogurt", "yogurt", "요거트", "group_dairy"),
  makeFood("food_pudding", "pudding", "푸딩", "group_low_fiber_snack"),
  makeFood("food_hamburger", "hamburger", "햄버거", "group_fastfood"),
  makeFood("food_chicken", "chicken", "치킨", "group_fastfood"),
  makeFood("food_pizza", "pizza", "피자", "group_fastfood"),
  makeFood("food_sandwich", "sandwich", "샌드위치", "group_bread"),
  makeFood("food_convenience_lunchbox", "convenience-lunchbox", "편의점도시락", "group_convenience_meal"),
  makeFood("food_triangle_kimbap", "triangle-kimbap", "삼각김밥", "group_convenience_rice"),
  makeFood("food_cup_ramen", "cup-ramen", "컵라면", "group_stirfried_noodle"),
  makeFood("food_malatang", "malatang", "마라탕", "group_spicy_soup"),
  makeFood("food_rose_tteokbokki", "rose-tteokbokki", "로제떡볶이", "group_tteokbokki"),
  makeFood("food_buldak_noodle", "buldak-noodle", "불닭볶음면", "group_stirfried_noodle"),
  makeFood("food_clear_broth", "clear-broth", "맑은육수", "group_clear_liquid", undefined, true),
  makeFood("food_water", "water", "물", "group_clear_liquid", undefined, true),
  makeFood("food_clear_soup", "clear-soup", "맑은국물", "group_clear_liquid"),
  makeFood("food_plain_cracker", "plain-cracker", "크래커", "group_low_fiber_snack"),
  makeFood("food_chicken_breast", "chicken-breast", "닭가슴살", "group_soft_protein"),
  makeFood("food_plain_dumpling_soup", "plain-dumpling-soup", "만둣국", "group_stew"),
];

const foodAliases = [
  ["food_white_porridge", "쌀죽"],
  ["food_white_porridge", "쌀미음"],
  ["food_udon", "가락국수"],
  ["food_banquet_noodles", "국수"],
  ["food_ramen", "분식라면"],
  ["food_salad", "샐러드볼"],
  ["food_milk", "커피우유"],
  ["food_sandwich", "에그샌드위치"],
  ["food_convenience_lunchbox", "도시락"],
  ["food_cup_ramen", "컵누들"],
  ["food_tteokbokki", "엽떡"],
  ["food_tteokbokki", "신전떡볶이"],
  ["food_buldak_noodle", "불닭게티"],
  ["food_rose_tteokbokki", "로제엽떡"],
  ["food_malatang", "마라샹궈"],
  ["food_triangle_kimbap", "삼각주먹밥"],
  ["food_convenience_lunchbox", "편도"],
  ["food_yogurt", "플레인요거트"],
  ["food_white_rice", "쌀밥"],
  ["food_boiled_egg", "계란"],
  ["food_soft_tofu", "순두부"],
  ["food_kimchi", "배추김치"],
  ["food_fried_combo", "모듬튀김"],
  ["food_coffee", "아메리카노"],
  ["food_white_bread", "토스트"],
  ["food_pudding", "푸딩컵"],
].map(([foodId, alias]) => ({
  foodId,
  alias,
  normalizedAlias: normalize(alias),
}));

const foodTagMaps = [
  ["food_potato", "tag_low_fiber", "껍질 제거 후 소량 섭취 기준"],
  ["food_potato", "tag_soft", "삶거나 으깨면 부담이 적다"],
  ["food_mashed_potato", "tag_low_fiber", "으깬 형태로 더 부드럽다"],
  ["food_mashed_potato", "tag_soft", "부드러운 전분 식품"],
  ["food_banana", "tag_low_fiber", "잘 익은 바나나는 비교적 무난하다"],
  ["food_apple", "tag_with_peel", "껍질째 먹는 경우 잔사가 남기 쉽다"],
  ["food_pear", "tag_with_peel", "껍질과 섬유질 주의"],
  ["food_ramen", "tag_chunky", "면과 건더기, 조미가 함께 있다"],
  ["food_kimchi_stew", "tag_spicy", "김치 양념이 강하다"],
  ["food_soybean_stew", "tag_chunky", "건더기가 많다"],
  ["food_gimbap", "tag_vegetables_heavy", "속재료 채소와 김이 함께 들어간다"],
  ["food_gimbap", "tag_seaweed", "김이 포함된다"],
  ["food_bibimbap", "tag_namul", "나물 비중이 높다"],
  ["food_bibimbap", "tag_spicy", "고추장 양념이 함께 간다"],
  ["food_sundae", "tag_processed", "가공 식재와 당면이 들어간다"],
  ["food_sundae", "tag_chunky", "속재가 남기 쉽다"],
  ["food_sweet_potato", "tag_high_fiber", "식이섬유가 많다"],
  ["food_sweet_potato", "tag_with_peel", "껍질째 먹는 경우가 많다"],
  ["food_corn", "tag_high_fiber", "껍질과 알갱이가 남기 쉽다"],
  ["food_corn", "tag_seeded", "알갱이 잔사가 남는다"],
  ["food_seaweed_soup", "tag_chunky", "미역 건더기가 남는다"],
  ["food_kimchi", "tag_spicy", "발효 + 양념 자극이 있다"],
  ["food_kimchi", "tag_chunky", "건더기와 섬유가 많다"],
  ["food_grape", "tag_with_peel", "껍질과 씨 주의"],
  ["food_strawberry", "tag_seeded", "겉면 씨가 많다"],
  ["food_watermelon", "tag_seeded", "씨와 색상 주의"],
  ["food_coffee", "tag_processed", "카페인 음료는 보수적으로 본다"],
  ["food_milk", "tag_processed", "전날에는 더 엄격하게 본다"],
  ["food_pudding", "tag_soft", "부드러운 간식이지만 가공식품이다"],
  ["food_sandwich", "tag_chunky", "속재료가 다양하고 건더기가 많다"],
  ["food_malatang", "tag_vegetables_heavy", "다양한 채소와 건더기가 많다"],
  ["food_buldak_noodle", "tag_fried", "조리와 조미가 강하다"],
  ["food_plain_dumpling_soup", "tag_chunky", "만두 속재가 남을 수 있다"],
  ["food_plain_dumpling_soup", "tag_processed", "가공 만두류다"],
].map(([foodId, foodTagId, note]) => ({ foodId, foodTagId, note }));

const rule = (
  id: string,
  dayStageId: string,
  foodTagId: string,
  status: "allowed" | "caution" | "avoid",
  rationale: string,
  priority: number,
) => ({
  id,
  dayStageId,
  foodTagId,
  status,
  rationale,
  priority,
});

const judgementRules = [
  rule("rule_d5_low_fiber", "stage_colonoscopy_d5", "tag_low_fiber", "allowed", "5일 전에는 저섬유 음식은 대체로 허용 범위다.", 30),
  rule("rule_d5_soft", "stage_colonoscopy_d5", "tag_soft", "allowed", "부드러운 음식은 비교적 무난하다.", 40),
  rule("rule_d5_clear_broth", "stage_colonoscopy_d5", "tag_clear_broth", "allowed", "맑은 국물은 안전한 선택지다.", 20),
  rule("rule_d5_dairy", "stage_colonoscopy_d5", "tag_dairy", "caution", "유제품은 개인차가 있어 주의가 필요하다.", 70),
  rule("rule_d5_processed", "stage_colonoscopy_d5", "tag_processed", "caution", "가공식품은 조미와 첨가물이 많아 보수적으로 본다.", 80),
  rule("rule_d5_with_peel", "stage_colonoscopy_d5", "tag_with_peel", "caution", "껍질은 잔사가 남을 수 있다.", 60),
  rule("rule_d5_chunky", "stage_colonoscopy_d5", "tag_chunky", "caution", "건더기가 많은 음식은 양을 줄이는 편이 안전하다.", 50),
  rule("rule_d5_spicy", "stage_colonoscopy_d5", "tag_spicy", "caution", "매운 양념은 장 자극을 높일 수 있다.", 55),
  rule("rule_d5_fried", "stage_colonoscopy_d5", "tag_fried", "caution", "튀김은 소화 부담이 있다.", 56),
  rule("rule_d5_high_fiber", "stage_colonoscopy_d5", "tag_high_fiber", "avoid", "고섬유 음식은 5일 전부터 줄이는 편이 안전하다.", 1),
  rule("rule_d5_seeded", "stage_colonoscopy_d5", "tag_seeded", "avoid", "씨가 있는 음식은 초기부터 피하는 편이 낫다.", 2),
  rule("rule_d5_whole_grain", "stage_colonoscopy_d5", "tag_whole_grain", "avoid", "잡곡류는 잔여물이 남기 쉽다.", 3),
  rule("rule_d5_nuts", "stage_colonoscopy_d5", "tag_nuts", "avoid", "견과류는 장에 남기 쉽다.", 4),
  rule("rule_d5_seaweed", "stage_colonoscopy_d5", "tag_seaweed", "avoid", "해조류는 질긴 섬유 때문에 피하는 편이 좋다.", 5),
  rule("rule_d5_vegetables_heavy", "stage_colonoscopy_d5", "tag_vegetables_heavy", "avoid", "채소 비중이 높으면 잔사 부담이 커진다.", 6),
  rule("rule_d5_namul", "stage_colonoscopy_d5", "tag_namul", "avoid", "나물류는 질긴 섬유가 많다.", 7),
  rule("rule_d5_red_purple", "stage_colonoscopy_d5", "tag_red_purple", "caution", "색이 진한 음식은 미리 줄이는 편이 좋다.", 90),
  rule("rule_d3_low_fiber", "stage_colonoscopy_d3", "tag_low_fiber", "allowed", "3일 전에는 저섬유 음식이 기본 식단이다.", 30),
  rule("rule_d3_soft", "stage_colonoscopy_d3", "tag_soft", "allowed", "부드러운 음식은 상대적으로 적합하다.", 40),
  rule("rule_d3_clear_broth", "stage_colonoscopy_d3", "tag_clear_broth", "allowed", "맑은 국물은 허용 가능하다.", 20),
  rule("rule_d3_dairy", "stage_colonoscopy_d3", "tag_dairy", "caution", "유제품은 복부팽만 가능성 때문에 주의가 필요하다.", 70),
  rule("rule_d3_processed", "stage_colonoscopy_d3", "tag_processed", "caution", "가공식품은 가능한 줄이는 편이 낫다.", 75),
  rule("rule_d3_high_fiber", "stage_colonoscopy_d3", "tag_high_fiber", "avoid", "고섬유 음식은 3일 전부터 피해야 한다.", 1),
  rule("rule_d3_seeded", "stage_colonoscopy_d3", "tag_seeded", "avoid", "씨가 있는 음식은 3일 전부터 피한다.", 2),
  rule("rule_d3_with_peel", "stage_colonoscopy_d3", "tag_with_peel", "avoid", "껍질이 있는 과일과 채소는 피해야 한다.", 3),
  rule("rule_d3_whole_grain", "stage_colonoscopy_d3", "tag_whole_grain", "avoid", "잡곡류는 검사 준비를 방해할 수 있다.", 4),
  rule("rule_d3_nuts", "stage_colonoscopy_d3", "tag_nuts", "avoid", "견과류는 금지에 가깝다.", 5),
  rule("rule_d3_seaweed", "stage_colonoscopy_d3", "tag_seaweed", "avoid", "해조류는 잔사가 남기 쉽다.", 6),
  rule("rule_d3_vegetables_heavy", "stage_colonoscopy_d3", "tag_vegetables_heavy", "avoid", "채소가 많은 음식은 피해야 한다.", 7),
  rule("rule_d3_namul", "stage_colonoscopy_d3", "tag_namul", "avoid", "나물류는 3일 전부터 제한한다.", 8),
  rule("rule_d3_spicy", "stage_colonoscopy_d3", "tag_spicy", "avoid", "매운 양념 음식은 피하는 편이 안전하다.", 9),
  rule("rule_d3_fried", "stage_colonoscopy_d3", "tag_fried", "avoid", "튀김은 장 정결에 불리하다.", 10),
  rule("rule_d3_chunky", "stage_colonoscopy_d3", "tag_chunky", "avoid", "건더기가 많은 음식은 피해야 한다.", 11),
  rule("rule_d3_red_purple", "stage_colonoscopy_d3", "tag_red_purple", "avoid", "적색·보라색 음식은 3일 전부터 피한다.", 12),
  rule("rule_d1_clear_broth", "stage_colonoscopy_d1", "tag_clear_broth", "allowed", "1일 전에는 맑은 유동식이 가장 안전하다.", 1),
  rule("rule_d1_low_fiber", "stage_colonoscopy_d1", "tag_low_fiber", "caution", "저섬유라도 고형식은 제한적으로만 본다.", 40),
  rule("rule_d1_soft", "stage_colonoscopy_d1", "tag_soft", "caution", "부드러운 음식도 전날에는 소량만 고려한다.", 50),
  rule("rule_d1_high_fiber", "stage_colonoscopy_d1", "tag_high_fiber", "avoid", "전날 고섬유 음식은 금지로 본다.", 2),
  rule("rule_d1_seeded", "stage_colonoscopy_d1", "tag_seeded", "avoid", "씨 있는 음식은 전날 금지에 가깝다.", 3),
  rule("rule_d1_with_peel", "stage_colonoscopy_d1", "tag_with_peel", "avoid", "껍질 있는 음식은 전날 피해야 한다.", 4),
  rule("rule_d1_whole_grain", "stage_colonoscopy_d1", "tag_whole_grain", "avoid", "잡곡류는 전날 금지로 본다.", 5),
  rule("rule_d1_nuts", "stage_colonoscopy_d1", "tag_nuts", "avoid", "견과류는 전날 금지다.", 6),
  rule("rule_d1_seaweed", "stage_colonoscopy_d1", "tag_seaweed", "avoid", "해조류는 전날 금지다.", 7),
  rule("rule_d1_vegetables_heavy", "stage_colonoscopy_d1", "tag_vegetables_heavy", "avoid", "채소가 많은 음식은 전날 피해야 한다.", 8),
  rule("rule_d1_namul", "stage_colonoscopy_d1", "tag_namul", "avoid", "나물류는 전날 금지다.", 9),
  rule("rule_d1_spicy", "stage_colonoscopy_d1", "tag_spicy", "avoid", "매운 음식은 전날 금지로 본다.", 10),
  rule("rule_d1_fried", "stage_colonoscopy_d1", "tag_fried", "avoid", "튀김은 전날 금지로 본다.", 11),
  rule("rule_d1_dairy", "stage_colonoscopy_d1", "tag_dairy", "avoid", "유제품은 전날 피하는 편이 안전하다.", 12),
  rule("rule_d1_chunky", "stage_colonoscopy_d1", "tag_chunky", "avoid", "건더기 많은 음식은 전날 금지다.", 13),
  rule("rule_d1_processed", "stage_colonoscopy_d1", "tag_processed", "avoid", "가공식품은 전날 보수적으로 금지한다.", 14),
  rule("rule_d1_red_purple", "stage_colonoscopy_d1", "tag_red_purple", "avoid", "적색·보라색 음식은 전날 피해야 한다.", 15),
];

const foodSimilarities = [
  { id: "sim_1", baseFoodId: "food_banana", similarFoodId: "food_apple", similarityType: "same_category" as const, note: "같은 과일군에서 비교적 무난한 선택", score: 75 },
  { id: "sim_2", baseFoodId: "food_banana", similarFoodId: "food_potato", similarityType: "substitute" as const, note: "부드러운 간식 대체", score: 82 },
  { id: "sim_3", baseFoodId: "food_ramen", similarFoodId: "food_udon", similarityType: "substitute" as const, note: "자극이 덜한 면류 대체", score: 88 },
  { id: "sim_4", baseFoodId: "food_ramen", similarFoodId: "food_banquet_noodles", similarityType: "substitute" as const, note: "맑은 국물 기반 대체", score: 86 },
  { id: "sim_5", baseFoodId: "food_sweet_potato", similarFoodId: "food_potato", similarityType: "substitute" as const, note: "잔사 부담이 덜한 전분 대체", score: 84 },
  { id: "sim_6", baseFoodId: "food_sweet_potato", similarFoodId: "food_banana", similarityType: "related_choice" as const, note: "부드러운 간식 대안", score: 78 },
  { id: "sim_7", baseFoodId: "food_tteokbokki", similarFoodId: "food_udon", similarityType: "substitute" as const, note: "덜 자극적인 면류로 대체", score: 80 },
  { id: "sim_8", baseFoodId: "food_tteokbokki", similarFoodId: "food_white_porridge", similarityType: "substitute" as const, note: "안전한 방향의 대체", score: 92 },
  { id: "sim_9", baseFoodId: "food_hamburger", similarFoodId: "food_sandwich", similarityType: "same_category" as const, note: "비슷한 빵 기반 식사", score: 70 },
  { id: "sim_10", baseFoodId: "food_kimbap", similarFoodId: "food_triangle_kimbap", similarityType: "same_category" as const, note: "같은 간편밥류", score: 85 },
];

const recommendedMenus = [
  {
    id: "menu_d5_breakfast",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d5",
    slug: "d5-breakfast",
    name: "5일 전 아침 추천",
    description: "상대적으로 부드럽고 단순한 조합",
    mealType: "breakfast" as const,
    statusHint: "allowed" as const,
    sortOrder: 1,
  },
  {
    id: "menu_d5_lunch",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d5",
    slug: "d5-lunch",
    name: "5일 전 점심 추천",
    description: "흰밥과 부드러운 단백질 위주",
    mealType: "lunch" as const,
    statusHint: "allowed" as const,
    sortOrder: 2,
  },
  {
    id: "menu_d3_breakfast",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d3",
    slug: "d3-breakfast",
    name: "3일 전 아침 추천",
    description: "저잔사 중심 식단",
    mealType: "breakfast" as const,
    statusHint: "allowed" as const,
    sortOrder: 1,
  },
  {
    id: "menu_d3_dinner",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d3",
    slug: "d3-dinner",
    name: "3일 전 저녁 추천",
    description: "면류와 부드러운 단백질 조합",
    mealType: "dinner" as const,
    statusHint: "allowed" as const,
    sortOrder: 2,
  },
  {
    id: "menu_d1_lunch",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d1",
    slug: "d1-lunch",
    name: "1일 전 점심 추천",
    description: "맑은 국물과 수분 위주",
    mealType: "lunch" as const,
    statusHint: "allowed" as const,
    sortOrder: 1,
  },
  {
    id: "menu_d1_snack",
    conditionId: condition.id,
    dayStageId: "stage_colonoscopy_d1",
    slug: "d1-snack",
    name: "1일 전 간식 추천",
    description: "소량만 가능한 간식 예시",
    mealType: "snack" as const,
    statusHint: "caution" as const,
    sortOrder: 2,
  },
];

const recommendedMenuFoods = [
  { recommendedMenuId: "menu_d5_breakfast", foodId: "food_white_porridge", roleLabel: "주식", quantityNote: "1그릇", sortOrder: 1 },
  { recommendedMenuId: "menu_d5_breakfast", foodId: "food_steamed_egg", roleLabel: "단백질", quantityNote: "1회분", sortOrder: 2 },
  { recommendedMenuId: "menu_d5_lunch", foodId: "food_white_rice", roleLabel: "주식", quantityNote: "1공기 이하", sortOrder: 1 },
  { recommendedMenuId: "menu_d5_lunch", foodId: "food_tofu", roleLabel: "반찬", quantityNote: "반 모", sortOrder: 2 },
  { recommendedMenuId: "menu_d3_breakfast", foodId: "food_white_porridge", roleLabel: "주식", quantityNote: "1그릇", sortOrder: 1 },
  { recommendedMenuId: "menu_d3_breakfast", foodId: "food_banana", roleLabel: "간식", quantityNote: "1개", sortOrder: 2 },
  { recommendedMenuId: "menu_d3_dinner", foodId: "food_udon", roleLabel: "주식", quantityNote: "1그릇", sortOrder: 1 },
  { recommendedMenuId: "menu_d3_dinner", foodId: "food_steamed_egg", roleLabel: "단백질", quantityNote: "1회분", sortOrder: 2 },
  { recommendedMenuId: "menu_d1_lunch", foodId: "food_clear_broth", roleLabel: "국물", quantityNote: "1컵", sortOrder: 1 },
  { recommendedMenuId: "menu_d1_lunch", foodId: "food_water", roleLabel: "수분", quantityNote: "충분히", sortOrder: 2 },
  { recommendedMenuId: "menu_d1_snack", foodId: "food_castella", roleLabel: "간식", quantityNote: "소량", sortOrder: 1 },
  { recommendedMenuId: "menu_d1_snack", foodId: "food_water", roleLabel: "수분", quantityNote: "함께", sortOrder: 2 },
];

const sources = [
  { id: "source_snuh", slug: "snuh-colonoscopy-guide", name: "서울대병원 대장내시경 준비 안내", kind: "hospital" as const, publisher: "서울대병원", url: "https://www.snuh.org/", note: null },
  { id: "source_ssmc", slug: "ssmc-colonoscopy-guide", name: "삼성서울병원 대장내시경 준비 안내", kind: "hospital" as const, publisher: "삼성서울병원", url: "https://www.samsunghospital.com/", note: null },
  { id: "source_cmc", slug: "cmc-colonoscopy-guide", name: "서울성모병원 대장내시경 준비 안내", kind: "hospital" as const, publisher: "서울성모병원", url: "https://www.cmcseoul.or.kr/", note: null },
  { id: "source_internal", slug: "health-signal-v1", name: "건강신호등 내부 큐레이션 v1", kind: "internal_guide" as const, publisher: "건강신호등", url: null, note: null },
];

const foodSources: {
  foodId: string;
  sourceId: string;
  evidenceNote: string;
  isPrimary: boolean;
}[] = [];

const foodGroupSources: {
  foodGroupId: string;
  sourceId: string;
  evidenceNote: string;
  isPrimary: boolean;
}[] = [];

const ruleSources = [
  { judgementRuleId: "rule_d5_high_fiber", sourceId: "source_snuh", evidenceNote: "고섬유 음식 제한 근거" },
  { judgementRuleId: "rule_d5_seeded", sourceId: "source_ssmc", evidenceNote: "씨 있는 음식 제한 근거" },
  { judgementRuleId: "rule_d3_whole_grain", sourceId: "source_cmc", evidenceNote: "잡곡 제한 근거" },
  { judgementRuleId: "rule_d3_spicy", sourceId: "source_internal", evidenceNote: "매운 음식 보수 판정 기준" },
  { judgementRuleId: "rule_d1_clear_broth", sourceId: "source_internal", evidenceNote: "1일 전 맑은 유동식 우선 원칙" },
  { judgementRuleId: "rule_d1_red_purple", sourceId: "source_cmc", evidenceNote: "적색·보라색 음식 제한 근거" },
];

async function main() {
  await prisma.searchLog.deleteMany();
  await prisma.ruleSource.deleteMany();
  await prisma.foodGroupSource.deleteMany();
  await prisma.foodSource.deleteMany();
  await prisma.recommendedMenuFood.deleteMany();
  await prisma.recommendedMenu.deleteMany();
  await prisma.foodSimilarity.deleteMany();
  await prisma.judgementRule.deleteMany();
  await prisma.foodTagMap.deleteMany();
  await prisma.foodAlias.deleteMany();
  await prisma.food.deleteMany();
  await prisma.foodGroupTag.deleteMany();
  await prisma.source.deleteMany();
  await prisma.foodTag.deleteMany();
  await prisma.foodGroup.deleteMany();
  await prisma.dayStage.deleteMany();
  await prisma.condition.deleteMany();

  await prisma.condition.create({ data: condition });
  await prisma.dayStage.createMany({ data: dayStages });
  await prisma.foodGroup.createMany({ data: foodGroups });
  await prisma.foodTag.createMany({ data: foodTags });
  await prisma.foodGroupTag.createMany({ data: foodGroupTags });
  await prisma.food.createMany({ data: foods });
  await prisma.foodAlias.createMany({ data: foodAliases });
  await prisma.foodTagMap.createMany({ data: foodTagMaps });
  await prisma.judgementRule.createMany({ data: judgementRules });
  await prisma.foodSimilarity.createMany({ data: foodSimilarities });
  await prisma.recommendedMenu.createMany({ data: recommendedMenus });
  await prisma.recommendedMenuFood.createMany({ data: recommendedMenuFoods });
  await prisma.source.createMany({ data: sources });
  await prisma.foodSource.createMany({ data: foodSources });
  await prisma.foodGroupSource.createMany({ data: foodGroupSources });
  await prisma.ruleSource.createMany({ data: ruleSources });

  console.log("Seed completed");
  console.log(`conditions: 1`);
  console.log(`dayStages: ${dayStages.length}`);
  console.log(`foodGroups: ${foodGroups.length}`);
  console.log(`foodTags: ${foodTags.length}`);
  console.log(`foods: ${foods.length}`);
  console.log(`aliases: ${foodAliases.length}`);
  console.log(`rules: ${judgementRules.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

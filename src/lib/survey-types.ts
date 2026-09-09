export type SurveyListItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  starts_on: string;
  ends_on: string;
  day_count: number;
  respondent_count: number;
  answer_count: number;
  other_text_count: number;
  fully_completed_count: number;
};

export type SurveyOption = {
  id: string;
  label: string;
  allows_other?: boolean;
};

export type SurveyQuestion = {
  id: string;
  day_index: number;
  day_title: string;
  sort_order: number;
  prompt: string;
  helper_text?: string | null;
  type: string;
  allows_na: boolean;
  na_label?: string | null;
  options: SurveyOption[];
  min_select: number;
  max_select?: number | null;
};

export type SurveyDetail = {
  id: string;
  slug: string;
  title: string;
  status: string;
  starts_on: string;
  ends_on: string;
  days: { id: string; day_index: number; title: string }[];
  questions: SurveyQuestion[];
  cohorts: { id: string; name: string; starts_on?: string | null; is_demo: boolean }[];
};

export type SurveyOptionCount = {
  option_id: string;
  label: string;
  count: number;
};

export type SurveyQuestionResult = {
  question_id: string;
  day_index: number;
  day_title: string;
  sort_order: number;
  prompt: string;
  type: string;
  allows_na: boolean;
  na_label?: string | null;
  option_counts: SurveyOptionCount[];
  na_count: number;
  other_text_count: number;
  response_count: number;
};

export type SurveyResults = {
  survey_id: string;
  respondent_count: number;
  answer_count: number;
  other_text_count: number;
  day_completions: { day_index: number; title: string; completion_count: number }[];
  questions: SurveyQuestionResult[];
};

export type SurveyOtherAnswer = {
  user_id: string;
  lead_id?: string | null;
  member_name: string;
  member_email: string;
  question_id: string;
  question_prompt: string;
  day_index: number;
  day_title: string;
  other_text: string;
  selected_option_ids: string[];
  answered_on: string;
};

export type SurveyOtherAnswersList = {
  items: SurveyOtherAnswer[];
  total: number;
};

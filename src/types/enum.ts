import { pgEnum } from "drizzle-orm/pg-core";

const accountTypeValues = ['liquid', 'non_liquid', 'debt'] as const;
export const accountTypeEnum = pgEnum('account_type', accountTypeValues);

const accountCategoryValues = ['cash', 'brokerage', 'retirement', 'real_estate', 'vehicle', 'loan', 'credit_card', 'other'] as const;
export const accountCategoryEnum = pgEnum('account_category', accountCategoryValues);
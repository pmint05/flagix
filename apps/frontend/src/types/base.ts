import { z } from "zod";

export const uuidSchema = z.uuid();
export const timestampSchema = z.iso.datetime();
export const nonEmptyString = z.string().min(1).max(255);
export const slugSchema = z
	.string()
	.regex(/^[a-zA-Z0-9-_]+$/)
	.min(1)
	.max(100);

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		data: z.array(itemSchema),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		pageSize: z.number().int().positive(),
	});
}

export type Paginated<T> = {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
};

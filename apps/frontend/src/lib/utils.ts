export function slugify(input: string): string {
	return input
		.replace(/[Đđ]/g, "d")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 100)
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

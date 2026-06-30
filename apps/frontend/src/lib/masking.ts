export function maskEmail(email?: string): string {
	if (!email) return "";
	const parts = email.split("@");
	if (parts.length !== 2) return email;
	const [name, domain] = parts;
	
	const maskedName = name.length > 2 
		? `${name.substring(0, 2)}***` 
		: `${name.substring(0, 1)}***`;
	return `${maskedName}@${domain}`;
}

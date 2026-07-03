import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface FormatDateOptions {
	showTime?: boolean;
	showDate?: boolean;
	showSeconds?: boolean;
}

export const formatDate = (
	date: Date | string,
	options?: FormatDateOptions,
) => {
	const {
		showTime = true,
		showDate = true,
		showSeconds = true,
	} = options || {};

	let formatString = "";

	if (showTime) {
		formatString += "HH:mm";
		if (showSeconds) {
			formatString += ":ss";
		}
	}

	if (showDate) {
		formatString += " dd/MM/yyyy";
	}

	return format(new Date(date), formatString, { locale: vi });
};

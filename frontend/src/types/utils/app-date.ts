export type AppDateInput = {
  year: number;
  month: number;
  day: number;
};

export class AppDate {
  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static fromYMD({ year, month, day }: AppDateInput): AppDate {
    if (month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12");
    }
    if (day < 1 || day > 31) {
      throw new Error("Day must be between 1 and 31");
    }

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error("Invalid date");
    }

    return new AppDate(date);
  }

  static fromDate(date: Date): AppDate {
    return new AppDate(new Date(date));
  }

  static fromISOString(isoString: string): AppDate {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid ISO string");
    }
    return new AppDate(date);
  }

  toDate(): Date {
    return new Date(this.date);
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  toYMD(): AppDateInput {
    return {
      year: this.date.getFullYear(),
      month: this.date.getMonth() + 1,
      day: this.date.getDate(),
    };
  }

  get year(): number {
    return this.date.getFullYear();
  }

  get month(): number {
    return this.date.getMonth() + 1;
  }

  get day(): number {
    return this.date.getDate();
  }

  format(pattern: string): string {
    const tokens: Record<string, string> = {
      yyyy: this.year.toString().padStart(4, "0"),
      MM: this.month.toString().padStart(2, "0"),
      dd: this.day.toString().padStart(2, "0"),
    };

    return pattern.replace(/(yyyy|MM|dd)/g, (match) => tokens[match] || match);
  }
}

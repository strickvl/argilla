export interface OptionForFilter {
  selected: boolean;
  label: string;
}

export interface RangeValue {
  ge?: number;
  le?: number;
}

export abstract class Filter {
  abstract get name(): string;

  get canFilter() {
    return true;
  }
}

export abstract class FilterWithOption extends Filter {
  constructor(
    public readonly name: string,
    public readonly options: OptionForFilter[] = []
  ) {
    super();
  }

  get title(): string {
    return null;
  }

  filterByText(text: string) {
    return this.options.filter((option) =>
      option.label.toLowerCase().includes(text.toLowerCase())
    );
  }

  get selectedOptions(): OptionForFilter[] {
    return this.options.filter((option) => option.selected);
  }

  get isAnswered(): boolean {
    return this.selectedOptions.length > 0;
  }

  completeMetadata(value: string) {
    value.split(",").forEach((label) => {
      const option = this.options.find((option) => option.label === label);
      if (option) option.selected = true;
    });
  }

  clear(): void {
    return this.options.forEach((o) => (o.selected = false));
  }
}

export abstract class FilterWithScore extends Filter {
  public value: RangeValue;
  constructor(
    public readonly name: string,
    public readonly min: number,
    public readonly max: number
  ) {
    super();

    this.value = {
      ge: min,
      le: max,
    };
  }

  get isAnswered(): boolean {
    return this.value.ge !== this.min || this.value.le !== this.max;
  }

  completeMetadata(value: string) {
    try {
      const { ge, le } = JSON.parse(value);
      this.value.ge = ge;
      this.value.le = le;
    } catch (error) {
      this.value.ge = this.min;
      this.value.le = this.max;
    }
  }

  clear(): void {
    this.value.ge = this.min;
    this.value.le = this.max;
  }
}

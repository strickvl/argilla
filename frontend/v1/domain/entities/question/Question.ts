import { Answer } from "../IAnswer";
import { Guard } from "../error";
import { Color } from "./Color";
import {
  QuestionAnswer,
  TextQuestionAnswer,
  SingleLabelQuestionAnswer,
  RatingLabelQuestionAnswer,
  MultiLabelQuestionAnswer,
  RankingQuestionAnswer,
  SpanQuestionAnswer,
} from "./QuestionAnswer";
import { QuestionType } from "./QuestionType";
import { Suggestion } from "./Suggestion";

interface OriginalQuestion {
  title: string;
  description: string;
  settings: any;
}

export class Question {
  public answer: QuestionAnswer;
  public suggestion: Suggestion;
  private original: OriginalQuestion;

  constructor(
    public readonly id: string,
    public readonly name: string,
    description: string,
    public readonly datasetId: string,
    title: string,
    public readonly isRequired: boolean,
    public settings: any
  ) {
    this.description = description;
    this.title = title;

    this.initialize();
    this.initializeAnswers();
    this.initializeOriginal();
  }

  private _description: string;
  public get description(): string {
    return this._description;
  }

  public set description(newDescription: string) {
    this._description = newDescription?.trim() ?? "";
  }

  private _title: string;
  public get title(): string {
    return this._title;
  }

  public set title(newTitle: string) {
    this._title = newTitle?.trim() ?? "";
  }

  public get isAnswered(): boolean {
    return this.answer.isValid;
  }

  public get hasValidValues(): boolean {
    return this.answer.hasValidValues;
  }

  public get type(): QuestionType {
    return QuestionType.from(this.settings.type);
  }

  public get isRankingType(): boolean {
    return this.type.isRankingType;
  }

  public get isMultiLabelType(): boolean {
    return this.type.isMultiLabelType;
  }

  public get isSingleLabelType(): boolean {
    return this.type.isSingleLabelType;
  }

  public get isTextType(): boolean {
    return this.type.isTextType;
  }

  public get isSpanType(): boolean {
    return this.type.isSpanType;
  }

  public get isRatingType(): boolean {
    return this.type.isRatingType;
  }

  public get isModified(): boolean {
    return (
      this.title !== this.original.title ||
      this.description !== this.original.description ||
      this.settings.use_markdown !== this.original.settings.use_markdown ||
      this.settings.visible_options !==
        this.original.settings.visible_options ||
      JSON.stringify(this.settings.options) !==
        JSON.stringify(this.original.settings.options)
    );
  }

  private MAX_DESCRIPTION_LENGTH = 500;
  private MAX_TITLE_LENGTH = 200;
  public validate(): Record<"title" | "description", string[]> {
    const validations: Record<"title" | "description", string[]> = {
      title: [],
      description: [],
    };

    if (!this.title) validations.title.push("This field is required.");

    if (this.title.length > this.MAX_TITLE_LENGTH)
      validations.title.push(
        `This must be less than ${this.MAX_TITLE_LENGTH}.`
      );

    if (this.description.length > this.MAX_DESCRIPTION_LENGTH)
      validations.description.push(
        `This must be less than ${this.MAX_DESCRIPTION_LENGTH}.`
      );

    return validations;
  }

  public get isQuestionValid(): boolean {
    return (
      this.validate().title.length === 0 &&
      this.validate().description.length === 0
    );
  }

  clearAnswer() {
    this.answer.clear();
  }

  restore() {
    this.title = this.original.title;
    this.description = this.original.description;

    this.restoreOriginal();
    this.initializeAnswers();
  }

  update() {
    this.initializeAnswers();
    this.initializeOriginal();
  }

  clone(questionReference: Question) {
    this.answer = questionReference.answer;
  }

  responseIfUnanswered(answer: Answer) {
    if (this.suggestion) {
      this.answer.responseIfUnanswered(this.suggestion);
    } else if (answer) {
      this.answer.responseIfUnanswered(answer);
    }
  }

  response(answer: Answer) {
    if (!answer) return;

    this.answer.response(answer);
  }

  addSuggestion(suggestion: Suggestion) {
    if (!suggestion) return;

    this.suggestion = suggestion;
  }

  reloadAnswerFromOptions() {
    this.initializeAnswers();
  }

  private createEmptyAnswers(): QuestionAnswer {
    if (this.isTextType) {
      return new TextQuestionAnswer(this.type, "");
    }

    if (this.isSpanType) {
      return new SpanQuestionAnswer(
        this.type,
        this.name,
        this.settings.options
      );
    }

    if (this.isRatingType) {
      return new RatingLabelQuestionAnswer(
        this.type,
        this.name,
        this.settings.options
      );
    }

    if (this.isMultiLabelType) {
      return new MultiLabelQuestionAnswer(
        this.type,
        this.name,
        this.settings.options
      );
    }

    if (this.isSingleLabelType) {
      return new SingleLabelQuestionAnswer(
        this.type,
        this.name,
        this.settings.options
      );
    }

    if (this.isRankingType) {
      return new RankingQuestionAnswer(
        this.type,
        this.name,
        this.settings.options
      );
    }

    Guard.throw(
      `Question answer for type ${this.type} is not implemented yet.`
    );
  }

  private initialize() {
    if (this.settings.options && !this.settings.visible_options) {
      this.settings.visible_options = this.settings.options.length;
    }

    if (this.isSpanType) {
      this.settings.options = this.settings.options.map((option) => {
        return {
          ...option,
          color: option.color
            ? Color.from(option.color)
            : Color.generate(option.value),
        };
      });
    }
  }

  private initializeAnswers() {
    this.answer = this.createEmptyAnswers();
  }

  private initializeOriginal() {
    const { options, ...rest } = this.settings;

    this.original = {
      title: this.title,
      description: this.description,
      settings: {
        ...rest,
        options: options?.map((option: string) => option),
      },
    };
  }

  private restoreOriginal() {
    const { options, ...rest } = this.original.settings;

    this.settings = {
      ...rest,
      options: options?.map((option: string) => option),
    };
  }
}

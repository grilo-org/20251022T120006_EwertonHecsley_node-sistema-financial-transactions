import Entity from '@/core/generics/Entity';
import Identity from '@/core/generics/Identity';

type CategoryProps = {
  description: string;
  user_id: string;
  createdAt?: Date;
  transactionCont?: number;
};

export class Category extends Entity<CategoryProps> {
  private constructor(props: CategoryProps, id?: Identity) {
    super(props, id);
  }

  static create(props: CategoryProps, id?: Identity): Category {
    return new Category({ ...props, createdAt: props.createdAt ?? new Date() }, id);
  }

  get description(): string {
    return this.props.description;
  }

  get user_id(): string {
    return this.props.user_id;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get transactionCont(): number {
    return this.props.transactionCont || 0;
  }

  set description(value: string) {
    this.props.description = value;
  }

  set user_id(value: string) {
    this.props.user_id = value;
  }

  set createdAt(value: Date) {
    this.props.createdAt = value;
  }

  updateDescription(newDescription: string): void {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('Description cannot be empty.');
    }

    this.props.description = newDescription;
  }
}

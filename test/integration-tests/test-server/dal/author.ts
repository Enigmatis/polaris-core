import {
    Column,
    CommonModel,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from '@enigmatis/polaris-typeorm';
import { Book } from './book';

@Entity()
export class Author extends CommonModel {
    @Column({ nullable: true })
    public firstName: string;

    @Column({ nullable: true })
    public lastName: string;

    @OneToMany(
        () => Book,
        book => book.author,
    )
    public books: Book[] | undefined;

    @PrimaryGeneratedColumn()
    protected id!: string;

    constructor(firstName: string, lastName: string) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public getId(): string {
        return this.id;
    }
}

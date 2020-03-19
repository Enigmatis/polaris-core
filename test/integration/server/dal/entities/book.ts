import {
    Column,
    CommonModel,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from '@enigmatis/polaris-typeorm';
import { Author } from './author';

@Entity()
export class Book extends CommonModel {
    @Column({ nullable: true })
    public title: string;

    @ManyToOne(
        () => Author,
        author => author.books,
    )
    public author: Author;

    @PrimaryGeneratedColumn('uuid')
    protected id!: string;

    constructor(title: string, author: Author) {
        super();
        this.title = title;
        this.author = author;
    }

    public getId(): string {
        return this.id;
    }
}

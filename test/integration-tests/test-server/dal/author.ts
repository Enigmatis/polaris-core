import { Column, CommonModel, Entity, OneToMany } from '@enigmatis/polaris-typeorm';
import { Book } from './book';

@Entity()
export class Author extends CommonModel {
    @Column()
    public firstName: string;

    @Column()
    public lastName: string;

    @OneToMany(
        () => Book,
        book => book.author,
    )
    public books: Book[];
    constructor(firstName: string, lastName: string, books?: Book[]) {
        super();
        this.firstName = firstName;
        this.lastName = lastName
        this.books = books ? books : [];
    }
}

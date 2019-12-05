import { Column, CommonModel, Entity, ManyToOne } from '@enigmatis/polaris-typeorm';
import { Author } from './author';

@Entity()
export class Book extends CommonModel {
    @Column()
    public title: string;

    @ManyToOne(
        () => Author,
        author => author.books,
    )
    public author: Author;

    constructor(title: string, author: Author) {
        super();
        this.title = title;
        this.author = author;
    }
}

export class TestClassInContext {
    public someProperty?: number;

    constructor(somePropertyInitialValue: number) {
        this.someProperty = somePropertyInitialValue;
    }

    public doSomething(): string {
        return `did something successfully with someProperty of ${this.someProperty}`;
    }
}

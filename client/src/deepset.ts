export class DeepSet<T> extends Set<T> {

    add(o: T) {
        for (let i of this)
            if (this.deepCompare(o, i))
                return this;
        super.add.call(this, o);
        return this;
    };

    has(o: T): boolean
    {
        for (let i of this)
            if (this.deepCompare(o, i))
                return true;
        return false;
    }

    private deepCompare(o: any, i: any) {
        return JSON.stringify(o) === JSON.stringify(i)
    }
}

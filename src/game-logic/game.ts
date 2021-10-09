import { assert } from "console";
import { DeepSet } from "./deepset";

// https://en.wikipedia.org/wiki/Rules_of_Go#Territory_scoring
enum ScoringRules 
{
    Territory,
    Area
}

enum Player 
{
    White = 'W',
    Black = 'B',
    Empty = ' '
}

function opposite(x: Player): Player 
{
    return x == Player.White ? Player.Black : Player.White;
}

interface Position 
{
    x: number,
    y: number
}

interface Group 
{
    stones: Position[],
    player: Player
}

export class Game 
{
    private boardSize: [number, number];
    private board: Array<Array<Player>>; // inner array = row
    private komi: number;
    private scoringRules: ScoringRules;
    private turn: Player;
    private inProgress: boolean;
    private turnHistory: Array<string>;
    private prisoners: Map<Player, number>;

    constructor(size: [number, number], komi = 6.5, scoringRules = ScoringRules.Territory) 
    {
        this.boardSize = size;
        this.board = Array.from(Array(this.boardSize[0]), () => new Array(this.boardSize[1]));
        this.initializeBoard();
        this.komi = komi;
        this.scoringRules = scoringRules;
        this.turn = Player.Black;
        this.inProgress = true;
        this.turnHistory = [];
        this.prisoners = new Map([[Player.Black, 0], [Player.White, 0]]);
    }

    initializeBoard(): void
    {
        for (let i = 0; i < this.boardSize[1]; i++)
        {
            for (let j = 0; j < this.boardSize[0]; j++)
            {
                this.board[i][j] = Player.Empty;
            }
        }
    }

    getPrisoners(): Map<Player, number> 
    {
        return this.prisoners;
    }

    playAt(pos: Position): [boolean, string] 
    {
        if (!this.inProgress)
            return [false, 'Game is already over'];

        if (this.board[pos.y][pos.x] != Player.Empty)
            return [false, 'Space is already occupied'];

        // first resolve liberties of adjacent enemy groups, then our group
        for (const adjacent of this.adjacent(pos)) 
        {
            const adjacentGroup = this.group(adjacent);
            if (adjacentGroup.player !== Player.Empty && 
                adjacentGroup.player !== this.turn && 
                this.liberties(adjacentGroup, pos) === 0)
            {
                this.capture(adjacentGroup);
            }
        }
        for (const adjacent of this.adjacent(pos)) 
        {
            const adjacentGroup = this.group(adjacent);
            if (adjacentGroup.player === this.turn && this.liberties(adjacentGroup, pos) === 0)
                return [false, 'No self capture']
        }

        this.board[pos.y][pos.x] = this.turn;
        this.turnHistory.push(`${this.turn} ${pos.x} ${pos.y}`);
        this.turn = opposite(this.turn);

        console.log(this.printBoard());
        console.log(this.getPrisoners());
        return [true, 'Successful']
    }

    capture(group: Group): void 
    {
        const score = this.prisoners.get(opposite(group.player));
        assert(score !== undefined);
        if (score !== undefined)
            this.prisoners.set(opposite(group.player), score + group.stones.length);
        for (const pos of group.stones) 
        {
            this.board[pos.y][pos.x] = Player.Empty;
        }
    }

    adjacent(pos: Position): Position[] 
    {
        let adjacentIntersections: Position[] = [];
        if (pos.x != 0) 
        {
            adjacentIntersections.push({ x: pos.x - 1, y: pos.y });
        }
        if (pos.x != this.boardSize[0] - 1) 
        {
            adjacentIntersections.push({ x: pos.x + 1, y: pos.y });
        }
        if (pos.y != 0) 
        {
            adjacentIntersections.push({ x: pos.x, y: pos.y - 1 });
        }
        if (pos.y != this.boardSize[1] - 1) 
        {
            adjacentIntersections.push({ x: pos.x, y: pos.y + 1 });
        }
        return adjacentIntersections;
    }

    getAt(pos: Position): Player 
    {
        return this.board[pos.y][pos.x];
    }

    liberties(group: Group, exclude?: Position): number 
    {
        let visited = new DeepSet<Position>();
        if (exclude !== undefined)
            visited.add(exclude);

        let numLiberties = 0;
        for (const stone of group.stones) 
        {
            for (const adjacent of this.adjacent(stone)) 
            {
                if (visited.has(adjacent) || this.getAt(adjacent) != Player.Empty)
                    continue;
                visited.add(adjacent);
                numLiberties += 1;
            }
        }
        return numLiberties;
    }

    group(pos: Position): Group 
    {
        if (this.getAt(pos) === Player.Empty)
            return { stones: [], player: Player.Empty };
        const player = this.getAt(pos);
        // BFS
        let visited = new DeepSet<Position>();
        let frontier: Array<Position> = [pos];

        while (frontier.length > 0) 
        {
            const next = frontier.pop();
            if (next === undefined)
                break; // just needed to make tsc happy
            
            if (visited.has(next)) 
            {
                continue;
            }
            visited.add(next);
            frontier.push(...this.adjacent(next).filter(x => this.getAt(x) == player));
        }

        return { stones: Array.from(visited), player: player };
    }

    pass(): void 
    {
        if (!this.inProgress)
            return;
        // 2 consecutive passes => game is finished
        if (this.turnHistory[this.turnHistory.length - 1] == "pass") 
        {
            this.turnHistory.push("pass");
            this.end();
            return;
        }
        this.turnHistory.push("pass");
        this.turn = opposite(this.turn);
    }

    end(): void 
    {
        this.inProgress = false;
    }

    score(): [number, number] 
    {
        // Implement later
        return [0, 0];
    }

    printBoard(): string 
    {
        return this.board.map(row => row.map(x => x ? x : ' ').join('')).join('\n');
    }

}
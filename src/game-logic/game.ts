import { DeepSet } from "./deepset";

// https://en.wikipedia.org/wiki/Rules_of_Go#Territory_scoring
enum ScoringRules 
{
    Territory,
    Area
}

// https://en.wikipedia.org/wiki/Time_control#Go
interface TimeControls
{
    mainTime: number,
    byoYomi: number,
    periods: number
}

enum Player 
{
    White = 'W',
    Black = 'B',
    Empty = ' '
}

export function playerFromString(s: string): Player
{
    switch (s)
    {
        
        case 'W':
            return Player.White;
        case 'B':
            return Player.Black;
        case ' ':
        default:
            return Player.Empty;
    }
}

function opposite(x: Player): Player 
{
    return x === Player.White ? Player.Black : Player.White;
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

class Game 
{
    private boardSize: [number, number];
    private board: Array<Array<Player>>; // inner array = row
    private komi: number;
    private scoringRules: ScoringRules;
    private turn: Player;
    private inProgress: boolean;
    private turnHistory: Array<string>;
    private prisoners: Map<Player, number>;
    private finalScores: Map<Player, number>;
    private boardHistory: Array<string>;

    constructor(size: [number, number], komi = 6.5, scoringRules = ScoringRules.Territory) 
    {
        this.boardSize = size;
        this.komi = komi;
        this.scoringRules = scoringRules;
        this.board = Array.from(Array(this.boardSize[0]), () => new Array(this.boardSize[1]));
        this.initializeBoard();
        this.turn = Player.Black;
        this.inProgress = true;
        this.turnHistory = [];
        this.prisoners = new Map([[Player.Black, 0], [Player.White, 0]]);
        this.finalScores = new Map([[Player.Black, 0], [Player.White, 0]]);
        this.boardHistory = [];
    }

    reset(): void
    {
        this.board = Array.from(Array(this.boardSize[0]), () => new Array(this.boardSize[1]));
        this.initializeBoard();
        this.turn = Player.Black;
        this.inProgress = true;
        this.turnHistory = [];
        this.prisoners = new Map([[Player.Black, 0], [Player.White, 0]]);
        this.finalScores = new Map([[Player.Black, 0], [Player.White, 0]]);
        this.boardHistory = [];
    }
    
    getTurn(): Player
    {
        return this.turn;
    }

    getTurnHistory(): Array<string>
    {
        return this.turnHistory;
    }

    getScoringRules(): ScoringRules
    {
        return this.scoringRules
    }

    getLastTurn(): string
    {
        return this.turnHistory[this.turnHistory.length - 1];
    }

    getBoardSize(): [number, number]
    {
        return this.boardSize;
    }

    getBoard(): Array<Array<Player>>
    {
        return this.board;
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

        if (this.board[pos.y][pos.x] !== Player.Empty)
            return [false, 'Space is already occupied'];
        const boardCopy = JSON.stringify(this.board);
        this.board[pos.y][pos.x] = this.turn;
        // first resolve liberties of adjacent enemy groups, then our group
        for (const adjacent of this.adjacent(pos)) 
        {
            const adjacentGroup = this.group(adjacent);
            if (adjacentGroup.player !== Player.Empty && 
                adjacentGroup.player !== this.turn && 
                this.liberties(adjacentGroup) === 0)
            {
                this.capture(adjacentGroup);
            }
        }
        for (const adjacent of this.adjacent(pos)) 
        {
            const adjacentGroup = this.group(adjacent);
            if (adjacentGroup.player === this.turn && this.liberties(adjacentGroup) === 0)
            {
                this.board[pos.y][pos.x] = Player.Empty;
                return [false, 'No self capture'];
            }
        }
        if (this.adjacent(pos).every(p => this.getAt(p) === opposite(this.turn)))
        {
            this.board[pos.y][pos.x] = Player.Empty;
            return [false, 'No self capture'];
        }

        if (this.positionalSuperko(this.board))
        {
            this.board = JSON.parse(boardCopy);
            return [false, 'Positional superko'];
        }

        this.turnHistory.push(`${this.turn} ${pos.x} ${pos.y}`);
        this.turn = opposite(this.turn);

        console.log(this.printBoard());
        console.log(this.getPrisoners());
        return [true, 'Successful']
    }

    capture(group: Group): void 
    {
        const score = this.prisoners.get(opposite(group.player));
        if (score !== undefined)
            this.prisoners.set(opposite(group.player), score + group.stones.length);
        for (const pos of group.stones) 
        {
            this.board[pos.y][pos.x] = Player.Empty;
        }
    }

    positionalSuperko(board: Array<Array<Player>>): boolean
    {
        const boardString = this.printBoard();
        if (this.boardHistory.includes(boardString))
        {
            return true;
        }
        this.boardHistory.push(boardString);
        return false;
    }

    finished(): boolean
    {
        return !this.inProgress;
    }

    adjacent(pos: Position): Position[] 
    {
        let adjacentIntersections: Position[] = [];
        if (pos.x !== 0) 
        {
            adjacentIntersections.push({ x: pos.x - 1, y: pos.y });
        }
        if (pos.x !== this.boardSize[0] - 1) 
        {
            adjacentIntersections.push({ x: pos.x + 1, y: pos.y });
        }
        if (pos.y !== 0) 
        {
            adjacentIntersections.push({ x: pos.x, y: pos.y - 1 });
        }
        if (pos.y !== this.boardSize[1] - 1) 
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
                if (visited.has(adjacent) || this.getAt(adjacent) !== Player.Empty)
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
            frontier.push(...this.adjacent(next).filter(x => this.getAt(x) === player));
        }

        return { stones: Array.from(visited), player: player };
    }

    pass(): void 
    {
        if (!this.inProgress)
            return;
        // 2 consecutive passes => game is finished
        if (this.turnHistory.length > 0 && this.turnHistory[this.turnHistory.length - 1].includes("pass")) 
        {
            this.turnHistory.push(`${this.turn} pass`);
            this.end();
            return;
        }
        this.turnHistory.push(`${this.turn} pass`);
        this.turn = opposite(this.turn);
    }

    end(winner?: Player): void 
    {
        this.inProgress = false;
        if (!winner)
        {
            this.finalScores = this.score();
        }
    }

    score(): Map<Player, number> 
    {
        // too hard lmao
        let s =  new Map<Player, number>([
            [Player.Black, 0],
            [Player.White, 0]
        ]);
        return s;
    }

    printBoard(): string 
    {
        return this.board.map(row => row.map(x => x !== ' ' ? x : '.').join('')).join('\n');
    }

    timeout(player: Player): void
    {
        this.turnHistory.push(`${player} timeout`);
        this.end(opposite(player));
    }

    resign(player: Player): void
    {
        this.turnHistory.push(`${player} resign`);
        this.end(opposite(player));
    }

    processMessage(msg: string): boolean // returns if the game has finished
    {
        if (msg.includes("pass"))
        {
            this.pass();
        }
        else if (msg.includes("timeout"))
        {
            const [player, _] = msg.split(' ');
            this.timeout(playerFromString(player));
        }
        else if (msg.includes("resign"))
        {
            const [player, _] = msg.split(' ');
            this.resign(playerFromString(player));
        }
        else
        {
            const [player, x, y] = msg.split(' ');
            this.playAt({x: parseInt(x), y: parseInt(y)});
        }
        
        return this.finished();
    }

    getResults(): string
    {
        const fullWord = new Map<string, string>([
            ["W", "White"],
            ["B", "Black"]
        ]);
        if (!this.finished())
        {
            return "";
        }
        if (this.getLastTurn().includes("resign"))
        {
            const winner = opposite(playerFromString(this.getLastTurn().substring(0, 1)));
            return `${fullWord.get(winner)} wins by resignation`;
        }
        else if (this.getLastTurn().includes("timeout"))
        {
            const winner = opposite(playerFromString(this.getLastTurn().substring(0, 1)));
            return `${fullWord.get(winner)} wins by time`;
        }
        else 
        {
            // it ain't undefined bud
            // @ts-ignore
            const winner = this.finalScores.get(Player.Black) > this.finalScores.get(Player.White)
                            ? Player.Black : Player.White; 
            return `${fullWord.get(winner)} wins, ${this.finalScores.get(winner)} to ${this.finalScores.get(opposite(winner))}`;
        }
    }

    serializeState(): string[]
    {
        return this.turnHistory;
    }

    deserializeState(history: string[]): void
    {
        if (this.turnHistory.length > 0)
        {
            this.reset();
        }
        for (let t of history)
        {
            this.processMessage(t);
        }
    }
}

export {
    Game,
    ScoringRules,
    Player,
    opposite
}
export type {
    TimeControls,
    Position
}
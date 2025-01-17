const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

const selectors = new Map([
    ['name', function (o) { return o.groups.name }],
    ['date', function (o) { return new Date(o.groups.date) }],
    ['importance', function (o) { return getImportance(o.comment) }]
]);

const COMMAND_REGEXP = new RegExp('\\/\\/\\sTODO\\s(?<command>.+)');
const IMPORTANT_REGEXP = new RegExp('.+?!+');
const FORMATTED_REGEXP = new RegExp('(?<name>.+?);\\s(?<date>.+?);\\s(?<question>.+)');

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => readFile(path));
}

function getTodos() {
    const todoComments = [];
    for (const file of files) {
        for (const line of file.split('\n')) {
            if (!COMMAND_REGEXP.test(line)) {
                continue;
            }

            const { groups: { command } } = COMMAND_REGEXP.exec(line);
            todoComments.push(command);
        }
    }

    return todoComments;
}

function getImportant() {
    const important = [];
    for (const comment of getTodos()) {
        if (IMPORTANT_REGEXP.test(comment)) {
            important.push(comment);
        }
    }
    return important;
}

function getImportance(line) {
    let marks = 0;
    for (const sym of line) {
        if (sym === '!') {
            marks += 1;
        }
    }
    return marks;
}


function sortBy(key) {
    const formatted = getFormatted();
    const selector = selectors.get(key) || function () { return null };
    const mod = key === 'name' ? 1 : -1;

    const sorted = formatted.sort((a, b) => {
        return selector(a) > selector(b) ? mod : -mod;
    }).map(o => o.comment);

    if (key !== 'importance') {
        for (const comment of getTodos()) {
            if (!FORMATTED_REGEXP.test(comment)) {
                sorted.push(comment);
            }
        }
    }
    return sorted;
}

function getCommentsAfterDate(date) {
    const actualDate = new Date(date);
    const res = [];
    for (const comment of getFormatted()) {
        const commentDate = comment.groups.date;
        if (new Date(commentDate) < actualDate) {
            continue;
        }
        res.push(comment.comment);
    }

    return res;
}


function getFormatted() {
    const formatted = [];
    for (const comment of getTodos()) {
        if (!FORMATTED_REGEXP.test(comment)) {
            continue;
        }
        const { groups } = FORMATTED_REGEXP.exec(comment);
        const obj = {
            groups: groups,
            comment: comment
        }
        formatted.push(obj);
    }
    return formatted;
}

function getTodosByUser(userName) {
    return getFormatted()
        .filter(o => o.groups.name.toLowerCase() === userName.toLowerCase())
        .map(o => o.comment);
}


function processCommand(command) {
    const args = command.split(' ');
    switch (args[0]) {
        case 'date':
            console.log(getCommentsAfterDate(args[1]));
            break;

        case 'sort':
            console.log(sortBy(args[1]));
            break;

        case 'user':
            console.log(getTodosByUser(args[1]));
            break;

        case 'important':
            console.log(getImportant());
            break;

        case 'show':
            console.log(getTodos());
            break;

        case 'exit':
            process.exit(0);
            break;

        default:
            console.log('wrong command');
            break;
    }
}

// TODO you can do it!

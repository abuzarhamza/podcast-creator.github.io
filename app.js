const simpleGit = require("simple-git");

const git = simpleGit.default();

function MyError(message) {
	Error.stackTraceLimit = 0;
	this.name = "MyError";
	this.message = message;
	Error.captureStackTrace();
}
MyError.prototype = new Error();

const gitGetConfigRemote = (key) => {
	return new Promise((resolve, reject) => {
		git.getConfig(key, (err, data) => {
			if (err) return reject(err);
			resolve(data);
		});
	});
};
const initSetup = async () => {
	// check the url name git

	let remoteUrlData = await gitGetConfigRemote("remote.origin.url");

	if (
		remoteUrlData?.value &&
		/\.github\.io\.git$/.test(remoteUrlData.value)
	) {
		throw new Error(`incorrect git url ${remoteUrlData.value}`);
	}
	const branch = await git.branch();
	if (branch !== "gh-pages") {
	}

	// console.Console(remoteOriginUrl);

	// console.log(branch);
	// console.log(branch.current);
	//check if the branch gh-pages
};

async function main() {
	try {
		initSetup();
	} catch (err) {
		console.error("------>", err.message);
	}
}
main();

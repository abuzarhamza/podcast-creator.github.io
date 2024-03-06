const simpleGit = require("simple-git");

const initGitHubSetup = function (git) {
	this.git = git;
	const gitGetConfigRemote = (key) => {
		return new Promise((resolve, reject) => {
			this.git.getConfig(key, (err, data) => {
				if (err) return reject(err);
				resolve(data);
			});
		});
	};

	const hasRemoteGHPageBranch = (branchData) => {
		if (branchData && branchData?.all) {
			branchData.all.forEach((branchName) => {
				if (/^origin\/gh-pages$/.test(branchName)) {
					return true;
				}
			});
		}
		return false;
	};

	const hasLocalGHPageBranch = (branchData) => {
		if (branchData && branchData?.all) {
			branchData.all.forEach((branchName) => {
				if (/^gh-pages$/.test(branchName)) {
					return true;
				}
			});
		}
		return false;
	};

	this.init = async () => {
		// check the url name git
		let remoteUrlData = await gitGetConfigRemote("remote.origin.url");

		if (
			remoteUrlData?.value &&
			!/\.github\.io\.git$/.test(remoteUrlData.value)
		) {
			throw new Error(`incorrect git url ${remoteUrlData.value}`);
		}

		await git.fetch(["--all"]);
		let remoteBranchData = await this.git.branch(["-r"]);
		let localBranchList = await this.git.branchLocal();
		console.log(remoteBranchData, localBranchList);
		if (
			!hasRemoteGHPageBranch(remoteBranchData) &&
			!hasLocalGHPageBranch(localBranchList)
		) {
			const status = await this.git.branch(["th-pages"]);
		}
	};
};

const dirStructureStatus = new (function () {})();

async function main() {
	try {
		//--new_podcast <podcast_name>
		//--update_pdocast

		//1. create new directory for html page and podcast
		//html
		// podcast/podcat_name/resource/_data.json
		// podcast/podcat_name/xml/podcast.xml
		const git = simpleGit.default();
		await new initGitHubSetup(git).init();
		await git.checkout("th-pages");
		const currentBranchData = await git.branch();
	} catch (err) {
		console.error("------>", err.message);
	}
}

main();

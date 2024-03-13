const simpleGit = require("simple-git");
const fs = require("fs/promises");
const md5File = require("md5-file");

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

const podcastSetupInt = new (function () {
	const getPodcastDirName = (podcastName) => {
		return `./podcast/${podcastName}`;
	};
	const getPodcastDataDir = (podcastName) => {
		return `${getPodcastDirName(podcastName)}/_data`;
	};

	const getDataFileName = () => return "_data.json";

	const getPodcastResourceDir = (podcastName) => {
		return `${getPodcastDirName(podcastName)}/resource`;
	};
	const getPodcastImgDir = (podcastName) => {
		return `${getPodcastResourceDir(podcastName)}/img`;
	};
	const getMd5HashDataFile = () => {
		return "./podcast/_md5_status.json";
	};

	const getDataFile = () => {};
	const _isvalidDirName = (dirName) => {
		//TODO his need to be fix regular expression
		if (/\s/.test(dirName)) {
			return false;
		}
		return true;
	};

	this.setUpRootDir = () => {
		if (!fs.existsSync("podcast")) {
			fs.mkdirSync("podcast", true);
		}
	};

	this.setupNewPodcastDir = (podcastName) => {
		if (!_isvalidDirName(podcastName)) {
			return new Error(
				"podcast name should not have space or other speical characters"
			);
		}
		const podcastDir = getPodcastDirName(podcastName);
		if (!fs.existsSync(podcastDir)) {
			fs.mkdirSync(podcastDir, true);
		}
		const dataDir = getPodcastDataDir(podcastName);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, true);
			//TODO to dump a sample json file
		}

		const resDir = getPodcastResourceDir(podcastName);
		if (!fs.existsSync(resDir)) {
			fs.mkdirSync(resDir, true);
		}

		const imgDir = getPodcastImgDir(podcastName);
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir, true);
		}
	};

	this.createNewDataFile = (podcastName) => {
		let dataFileName = `${getPodcastDataDir(podcastName)}/_data.json`;

		if (fs.existsSync(dataFileName)) {
			return false;
		}

		let jsonSample = {
			name: "",
			description: "",
			updated_at: new Date().toJSON(),
			podcasts: [
				{
					item_no: 1,
					name: "same",
					file_url: "",
					published_at: new Date().toJSON(),
					publish_status: false,
				},
			],
		};
		fs.writeFileSync(dataFileName, JSON.stringify(jsonSample, null, 4));
	};

	const updateMD5FileObject = (
		id,
		podcast_name,
		file_name,
		file_type = "data"
	) => {
		return {
			id,
			podcast_name,
			file_name,
			file_type,
			md5_hash: md5File(),
		};
	};

	const writeMD5File = async (podcastName) => {
		let md5FileDataName = getMd5HashDataFile();
		let filehandle;
		try {
			filehandle = await fs.open(md5FileDataName, "w");
			await filehandle.writeFile(
				JSON.stringify({
					md5_check: [updateMD5FileObject(1, podcastName)],
				}),
				"utf-8"
			);
		} finally {
			await filehandle?.close();
		}
	};

	this.udpatemd5forDataFile = async (podcastName) => {
		/*
			{
				md5_check: [
					{
						sno: 1
						podcast_name: ""
						file_name: ""
						md5_hash: ""
						file_type: "data"
					}
				]
					
				
			}
		*/
		let md5File = getMd5HashDataFile();
		if (!fs.existsSync(md5File)) {
			await writeMD5File(podcastName);
		}
		const jsonDataStr = fs.readFileSync(getMd5HashFile(), "utf8");
		const jsonData = JSON.parse(jsonDataStr);
		let;
	};
})();

async function main() {
	try {
		//--new_podcast <podcast_name>
		//--update_pdocast

		let argv = "new_podcast";
		let podcastName = "happy_nist";
		//1. create new directory for html page and podcast
		//html
		// podcast/podcat_name/resource/_data.json
		// podcast/podcat_name/xml/podcast.xml

		// const git = simpleGit.default();
		// await new initGitHubSetup(git).init();
		// await git.checkout("th-pages");
		// const currentBranchData = await git.branch();
		podcastSetupInt.setUpRootDir();
		if (argv === "new_podcast") {
			podcastSetupInt.setupNewPodcastDir(podcastName);
			podcastSetupInt.createNewDataFile(podcastName);
			podcastSetupInt.udpatemd5forDataFile(podcastName);
		}
		if (argv === "update_podcast") {
		}
	} catch (err) {
		console.error("------>", err.message);
	}
}

main();

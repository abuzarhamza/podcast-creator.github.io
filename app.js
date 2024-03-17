const simpleGit = require("simple-git");
const fs = require("fs");
const md5File = require("md5-file");
const path = require("path");
const _ = require("lodash");
const ShortUniqueId = require("short-unique-id");

const uid = new ShortUniqueId({ length: 6 });

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

	const getDataFileName = () => {
		return "_data.json";
	};

	const getPodcastResourceDir = (podcastName) => {
		return `${getPodcastDirName(podcastName)}/resource`;
	};
	const getPodcastImgDir = (podcastName) => {
		return `${getPodcastResourceDir(podcastName)}/img`;
	};
	const getMD5LockFile = () => {
		return "./podcast/_md5_lock.json";
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

	const updateMD5LockFileObject = (
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
			integrity: md5File.sync(
				path.join(getPodcastDataDir(podcast_name), getDataFileName())
			),
			path: path.join(getPodcastDataDir(podcast_name), getDataFileName()),
		};
	};

	const getMD5LockFileObject = (podcast_name) => {
		return {
			md5_lock: [
				updateMD5LockFileObject(
					uid.rnd(),
					podcast_name,
					getDataFileName(),
					"data"
				),
			],
		};
	};

	const modifyMD5LockFile = async (podcastName, flag = "w") => {
		const md5LockFile = getMD5LockFile();
		//write md5_lock file
		if (flag === "w") {
			let obj = getMD5LockFileObject(podcastName);
			console.log(obj);
			try {
				fs.writeFileSync(md5LockFile, JSON.stringify(obj, null, 4));
			} catch (err) {
				throw new Error(err);
			}
		} else if (flag === "u") {
			try {
				const data = fs.readFileSync(md5LockFile, "utf8");
				let obj = JSON.parse(data);
				if (
					!obj ||
					!obj.md5_lock ||
					!Array.isArray(obj.md5_lock) ||
					obj.md5_lock.length === 0
				) {
					throw new Error(`${getMD5LockFile()} is not proper format`);
				} else if (obj.md5_lock.length > 1) {
					let md5Index = _.findIndex(obj.md5_lock, {
						podcast_name: podcastName,
						file_type: "data",
					});
					let newObj = updateMD5LockFileObject(
						uid.rnd(),
						podcastName,
						getDataFileName(),
						"data"
					);
					if (md5Index === -1) {
						obj.md5_lock.push(newObj);
					} else {
						let rndId = uid.rnd();
						if (
							obj.md5_lock[md5Index] &&
							obj.md5_lock[md5Index].id
						) {
							rndId = obj.md5_lock[md5Index].id;
						}
						obj.md5_lock[md5Index] = _.merge(newObj, { id: rndId });
					}
					fs.writeFileSync(md5LockFile, JSON.stringify(obj, null, 4));
				}
			} catch (err) {
				throw new Error(err);
			}
		}
	};

	this.udpateMD5LockforDataFile = async (podcastName) => {
		//if md5_lock file is not exist, then write md5_lock file
		if (!fs.existsSync(getMD5LockFile())) {
			modifyMD5LockFile(podcastName, "w");
			return;
		}
		//if md5_lock file is exist, then read md5_lock file
		modifyMD5LockFile(podcastName, "u");
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
			podcastSetupInt.udpateMD5LockforDataFile(podcastName); // this is like outside package-lock.file
		}
		// if (argv === "update_podcast") {
		// }
	} catch (err) {
		console.error("------>", err.message);
	}
}

main();

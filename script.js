const downloadData = {
	mac: {
		packageManagers: [
			{
				id: "homebrew",
				name: "Homebrew",
				type: "command",
				command: "brew install --cask uniplan",
			},
			{
				id: "dmg",
				name: "DMG",
				type: "download",
				url: "",
				label: "Download for macOS",
			},
		],
	},
	windows: {
		packageManagers: [
			{
				id: "winget",
				name: "Winget",
				type: "command",
				command: "winget install dStudios.UniPlan",
			},
			{
				id: "choco",
				name: "Chocolatey",
				type: "command",
				command: "choco install uniplan",
			},
			{
				id: "scoop",
				name: "Scoop",
				type: "command",
				command: "scoop bucket add extras; scoop install uniplan",
			},
			{
				id: "exe",
				name: ".exe Installer",
				type: "download",
				url: "",
				label: "Download the Installer",
			},
		],
	},
	linux: {
		packageManagers: [
			{
				id: "snap",
				name: "Snap",
				type: "command",
				command: "sudo snap install uniplan",
			},
			{
				id: "flathub",
				name: "Flathub",
				type: "command",
				command: "flatpak install flathub org.dstudios.uniplan",
			},
			{
				id: "arch",
				name: "Arch Linux",
				type: "command",
				command: "yay -S uniplan",
			},
			{
				id: "void",
				name: "Void Linux",
				type: "command",
				command: "sudo xbps-install -Syu && sudo xbps-install -y void-repo-nonfree && sudo xbps-install -S uniplan",
			},
			{
				id: "appimage",
				name: "AppImage",
				type: "download",
				url: "",
				label: "Download the AppImage",
			},
		],
	},
	mobile: {
		packageManagers: [
			{
				id: "ios",
				name: "iOS",
				type: "download",
				url: "https://apps.apple.com",
				label: "Download on the App Store",
			},
			{
				id: "android",
				name: "Android",
				type: "download",
				url: "https://play.google.com",
				label: "Get it on Google Play",
			},
		],
	},
};

const GITHUB_RELEASES_URL = "https://api.github.com/repos/dStudios-735453/UniPlan_Releases/releases/latest";

function detectOS() {
	const userAgent = navigator.userAgent.toLowerCase();
	if (/iphone|ipad|ipod|android/.test(userAgent)) return "mobile";
	if (/mac/.test(userAgent) && !/iphone|ipad|ipod|android/.test(userAgent)) return "mac";
	if (/win/.test(userAgent)) return "windows";
	if (/linux/.test(userAgent)) return "linux";
	return "mac";
}

function detectArch() {
	const userAgent = navigator.userAgent.toLowerCase();
	const platform = navigator.platform?.toLowerCase() || "";
	if (/arm64|aarch64|armv8/.test(userAgent) || platform.includes("arm")) {
		return "arm";
	}
	if (/wow64|win64|x64|x86_64/.test(userAgent) || platform.includes("x64")) {
		return "x64";
	}
	return "x64";
}

let currentOS = detectOS();
let currentPM = downloadData[currentOS].packageManagers[0].id;
let currentArch = detectArch();
let releaseAssets = [];

async function fetchLatestRelease() {
	try {
		const response = await fetch(GITHUB_RELEASES_URL);
		if (!response.ok) throw new Error("Failed to fetch release");
		const data = await response.json();
		releaseAssets = data.assets || [];
		updateDownloadUrls();
	} catch (error) {
		console.error("Error fetching release:", error);
	}
}

function findAsset(patterns) {
	for (const pattern of patterns) {
		const asset = releaseAssets.find((a) => pattern.test(a.name));
		if (asset) return asset.browser_download_url;
	}
	return "";
}

function updateDownloadUrls() {
	const arch = currentArch;

	downloadData.windows.packageManagers.find((p) => p.id === "exe").url = findAsset([new RegExp(`_${arch === "arm" ? "arm64" : "x64"}-setup\\.exe$`)]);

	downloadData.mac.packageManagers.find((p) => p.id === "dmg").url = findAsset([/_universal\.dmg$/, /\.dmg$/]);

	downloadData.linux.packageManagers.find((p) => p.id === "appimage").url = findAsset([new RegExp(`_${arch === "arm" ? "aarch64" : "amd64"}\\.AppImage$`)]);
}

function init() {
	const osButtons = document.querySelectorAll("#os-control .segment-btn");
	osButtons.forEach((btn) => {
		if (btn.dataset.os === currentOS) {
			btn.classList.add("active");
		} else {
			btn.classList.remove("active");
		}
	});

	fetchLatestRelease().then(() => {
		setupOSControl();
		updatePackageManagerControl();
		updateDownloadContent();
	});
}

function setupOSControl() {
	const osButtons = document.querySelectorAll("#os-control .segment-btn");
	osButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			osButtons.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			currentOS = btn.dataset.os;
			currentPM = downloadData[currentOS].packageManagers[0].id;
			updatePackageManagerControl();
			updateDownloadContent();
		});
	});
}

function updatePackageManagerControl() {
	const pmControl = document.getElementById("pm-control");
	const packageManagers = downloadData[currentOS].packageManagers;

	pmControl.innerHTML = "";

	packageManagers.forEach((pm) => {
		const btn = document.createElement("button");
		btn.className = `segment-btn ${pm.id === currentPM ? "active" : ""}`;
		btn.dataset.pm = pm.id;
		btn.textContent = pm.name;
		btn.addEventListener("click", () => {
			pmControl.querySelectorAll(".segment-btn").forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			currentPM = pm.id;
			updateDownloadContent();
		});
		pmControl.appendChild(btn);
	});
}

function isMobileDevice() {
	return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

function updateDownloadContent() {
	const content = document.getElementById("download-content");
	const pm = downloadData[currentOS].packageManagers.find((p) => p.id === currentPM);

	if (!pm) return;

	if (pm.type === "command") {
		content.innerHTML = `
            <div class="download-option active">
                <div class="command-block">
                    <code class="command-text">${pm.command}</code>
                    <button class="copy-btn" onclick="copyToClipboard('${pm.command}', this)">
                        <svg class="copy-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy</span>
                    </button>
                </div>
            </div>
        `;
	} else if (currentOS === "mobile") {
		if (isMobileDevice()) {
			content.innerHTML = `
            <div class="download-option active">
                <a href="${pm.url}" class="download-btn" target="_blank">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    ${pm.label}
                </a>
            </div>
        `;
		} else {
			content.innerHTML = `
            <div class="download-option active">
                <div class="qr-wrapper">
                    <div id="qr-code"></div>
                    <p class="qr-hint">Scan with your phone to download</p>
                </div>
                <a href="${pm.url}" class="download-btn" target="_blank" style="margin-top: 16px;">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    ${pm.label}
                </a>
            </div>
        `;
			const container = document.getElementById("qr-code");
			if (container && typeof QRCode !== "undefined") {
				new QRCode(container, {
					text: pm.url,
					width: 200,
					height: 200,
					colorDark: "#ECEDEE",
					colorLight: "#1C1C1E",
					correctLevel: QRCode.CorrectLevel.M,
				});
			} else if (container) {
				container.innerHTML = '<p class="qr-hint">QR code library not loaded. Please refresh.</p>';
			}
		}
	} else {
		if (!pm.url) {
			content.innerHTML = `
            <div class="download-option active">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="qr-hint">Fetching latest release...</p>
                </div>
            </div>
        `;
			return;
		}
		content.innerHTML = `
            <div class="download-option active">
                <a href="${pm.url}" class="download-btn" target="_blank">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    ${pm.label}
                </a>
            </div>
        `;
	}
}

function copyToClipboard(text, btn) {
	navigator.clipboard.writeText(text).then(() => {
		btn.classList.add("copied");
		btn.querySelector("span").textContent = "Copied!";
		setTimeout(() => {
			btn.classList.remove("copied");
			btn.querySelector("span").textContent = "Copy";
		}, 2000);
	});
}

document.addEventListener("DOMContentLoaded", init);

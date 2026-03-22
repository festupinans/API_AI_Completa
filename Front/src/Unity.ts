type BannerType = 'warning' | 'error' | 'log'

interface UnityConfig {
	arguments: string[]
	dataUrl: string
	frameworkUrl: string
	codeUrl: string
	streamingAssetsUrl: string
	companyName: string
	productName: string
	productVersion: string
	showBanner: (msg: string, type: BannerType) => void
}

interface UnityInstance {
	SetFullscreen: (value: number) => void
}

declare function createUnityInstance(
	canvas: HTMLCanvasElement,
	config: UnityConfig,
	onProgress: (progress: number) => void,
): Promise<UnityInstance>

const canvas = document.querySelector<HTMLCanvasElement>('#Unity_Canvas')

if (canvas) {
	const warningBanner = document.createElement('div')
	warningBanner.id = 'unity-warning'
	warningBanner.style.position = 'fixed'
	warningBanner.style.top = '12px'
	warningBanner.style.left = '12px'
	warningBanner.style.right = '12px'
	warningBanner.style.zIndex = '1000'
	warningBanner.style.display = 'none'

	const loadingBar = document.createElement('div')
	loadingBar.id = 'unity-loading-bar'
	loadingBar.style.position = 'fixed'
	loadingBar.style.left = '50%'
	loadingBar.style.bottom = '24px'
	loadingBar.style.transform = 'translateX(-50%)'
	loadingBar.style.width = '280px'
	loadingBar.style.height = '10px'
	loadingBar.style.background = '#2a2a2a'
	loadingBar.style.borderRadius = '999px'
	loadingBar.style.overflow = 'hidden'

	const progressBar = document.createElement('div')
	progressBar.id = 'unity-progress-bar-full'
	progressBar.style.height = '100%'
	progressBar.style.width = '0%'
	progressBar.style.background = '#3f8cff'
	progressBar.style.transition = 'width 120ms linear'
	loadingBar.appendChild(progressBar)

	const fullscreenButton = document.createElement('button')
	fullscreenButton.id = 'unity-fullscreen-button'
	fullscreenButton.textContent = 'Fullscreen'
	fullscreenButton.style.position = 'fixed'
	fullscreenButton.style.right = '16px'
	fullscreenButton.style.bottom = '16px'
	fullscreenButton.style.zIndex = '1000'

	document.body.append(warningBanner, loadingBar, fullscreenButton)

	const unityShowBanner = (msg: string, type: BannerType): void => {
		const div = document.createElement('div')
		div.textContent = msg
		div.style.padding = '10px'
		div.style.marginBottom = '8px'
		div.style.borderRadius = '6px'

		if (type === 'error') {
			div.style.background = '#dc2626'
			div.style.color = '#fff'
		} else if (type === 'warning') {
			div.style.background = '#facc15'
			div.style.color = '#111827'
			window.setTimeout(() => {
				warningBanner.removeChild(div)
				warningBanner.style.display = warningBanner.children.length ? 'block' : 'none'
			}, 5000)
		} else {
			div.style.background = '#1f2937'
			div.style.color = '#fff'
		}

		warningBanner.appendChild(div)
		warningBanner.style.display = warningBanner.children.length ? 'block' : 'none'
	}

	const unityRoot = '/Unity'
	const config: UnityConfig = {
		arguments: [],
		dataUrl: `${unityRoot}/web.data.br`,
		frameworkUrl: `${unityRoot}/web.framework.js.br`,
		codeUrl: `${unityRoot}/web.wasm.br`,
		streamingAssetsUrl: `${unityRoot}/StreamingAssets`,
		companyName: 'DefaultCompany',
		productName: 'Unity_IA',
		productVersion: '0.1.0',
		showBanner: unityShowBanner,
	}

	if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
		const meta = document.createElement('meta')
		meta.name = 'viewport'
		meta.content =
			'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes'
		document.head.appendChild(meta)
		canvas.style.width = '100vw'
		canvas.style.height = '100vh'
	} else {
		canvas.style.width = '100vw'
		canvas.style.height = '100vh'
	}

	const script = document.createElement('script')
	script.src = `${unityRoot}/web.loader.js`
	script.onload = () => {
		createUnityInstance(canvas, config, (progress) => {
			progressBar.style.width = `${Math.round(progress * 100)}%`
		})
			.then((unityInstance) => {
				loadingBar.style.display = 'none'
				fullscreenButton.onclick = () => {
					unityInstance.SetFullscreen(1)
				}
			})
			.catch((message: unknown) => {
				const errorMessage = message instanceof Error ? message.message : String(message)
				unityShowBanner(errorMessage, 'error')
			})
	}

	script.onerror = () => {
		unityShowBanner('No se pudo cargar Unity loader (web.loader.js).', 'error')
	}

	document.body.appendChild(script)
}

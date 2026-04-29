import UIKit
import SpriteKit

class GameViewController: UIViewController {

    private static var didStartGameCenterAuth = false
    /// `SKView.bounds` are often `.zero` in `viewDidLoad`; presenting then yields a black screen.
    private var didPresentInitialScene = false

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let skView = view as? SKView else {
            let skView = SKView(frame: view.bounds)
            skView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            view.addSubview(skView)
            configureSKView(skView)
            return
        }

        configureSKView(skView)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard !didPresentInitialScene else { return }
        guard let skView = view as? SKView ?? view.subviews.compactMap({ $0 as? SKView }).first else { return }
        let size = skView.bounds.size
        guard size.width > 0, size.height > 0 else { return }
        didPresentInitialScene = true
        presentTitleScene(in: skView)
    }

    private func configureSKView(_ skView: SKView) {
        skView.ignoresSiblingOrder = true
        skView.showsFPS = false
        skView.showsNodeCount = false
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if !Self.didStartGameCenterAuth {
            Self.didStartGameCenterAuth = true
            GameCenterAuth.start(rootViewController: self)
        }
    }

    private func presentTitleScene(in skView: SKView) {
        let scene = TitleScene(size: skView.bounds.size)
        scene.scaleMode = .aspectFill
        skView.presentScene(scene)
    }

    override func loadView() {
        let skView = SKView()
        skView.ignoresSiblingOrder = true
        view = skView
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        .allButUpsideDown
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
}

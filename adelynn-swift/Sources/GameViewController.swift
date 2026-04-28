import UIKit
import SpriteKit

class GameViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let skView = view as? SKView else {
            // If the view is not an SKView, create one
            let skView = SKView(frame: view.bounds)
            skView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            view.addSubview(skView)
            presentTitleScene(in: skView)
            return
        }

        skView.ignoresSiblingOrder = true
        skView.showsFPS = false
        skView.showsNodeCount = false

        presentTitleScene(in: skView)
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
        UIDevice.current.userInterfaceIdiom == .phone ? .landscape : .all
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
}

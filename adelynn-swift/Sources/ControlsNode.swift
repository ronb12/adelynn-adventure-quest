import SpriteKit
import UIKit

class ControlsNode: SKNode {

    // MARK: - Callbacks
    var onAttack:       (() -> Void)?
    var onSpinAttack:   (() -> Void)?
    var onInteract:     (() -> Void)?
    var onCycleWeapon:  (() -> Void)?
    var onTogglePause:  (() -> Void)?
    var onRun:          ((Bool) -> Void)?

    // MARK: - State
    private(set) var joystickDirection: CGPoint = .zero

    // Joystick geometry
    private var joystickBase: SKShapeNode!
    private var joystickThumb: SKShapeNode!
    private var joystickCenter: CGPoint = .zero
    private var joystickTouchID: UITouch?
    private let joystickRadius: CGFloat = 58
    private let thumbRadius:    CGFloat = 22

    // Button touches
    private var attackTouchID:   UITouch?
    private var interactTouchID: UITouch?
    private var runTouchID:      UITouch?
    private var cycleTouchID:    UITouch?

    private let sceneSize: CGSize

    init(size: CGSize) {
        self.sceneSize = size
        super.init()
        buildJoystick()
        buildButtons()
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Build Joystick
    private func buildJoystick() {
        let cx = -sceneSize.width/2 + 80
        let cy = -sceneSize.height/2 + 80
        joystickCenter = CGPoint(x: cx, y: cy)

        joystickBase = SKShapeNode(circleOfRadius: joystickRadius)
        joystickBase.fillColor = UIColor.white.withAlphaComponent(0.08)
        joystickBase.strokeColor = UIColor.white.withAlphaComponent(0.22)
        joystickBase.lineWidth = 2
        joystickBase.position = joystickCenter
        joystickBase.zPosition = 5
        addChild(joystickBase)

        // Cross lines
        for angle: CGFloat in [0, .pi/2] {
            let line = SKShapeNode(path: {
                let p = UIBezierPath()
                p.move(to: CGPoint(x: cos(angle)*joystickRadius*0.5, y: sin(angle)*joystickRadius*0.5))
                p.addLine(to: CGPoint(x: -cos(angle)*joystickRadius*0.5, y: -sin(angle)*joystickRadius*0.5))
                return p.cgPath
            }())
            line.strokeColor = UIColor.white.withAlphaComponent(0.12)
            line.lineWidth = 1
            joystickBase.addChild(line)
        }

        joystickThumb = SKShapeNode(circleOfRadius: thumbRadius)
        joystickThumb.fillColor = UIColor.white.withAlphaComponent(0.28)
        joystickThumb.strokeColor = UIColor.white.withAlphaComponent(0.55)
        joystickThumb.lineWidth = 2
        joystickThumb.position = joystickCenter
        joystickThumb.zPosition = 6
        addChild(joystickThumb)
    }

    // MARK: - Build Buttons
    private func buildButtons() {
        let bx = sceneSize.width/2 - 30
        let by = -sceneSize.height/2 + 50

        // A — Attack (bottom-right area)
        makeButton(name:"btnAttack",  label:"A", color:.from(hex:"#cc3300"),
                   position: CGPoint(x:bx,      y:by+30))
        // B — Run (left of A)
        makeButton(name:"btnRun",     label:"B", color:.from(hex:"#226622"),
                   position: CGPoint(x:bx-60,   y:by+8))
        // X — Interact (above B)
        makeButton(name:"btnInteract",label:"X", color:.from(hex:"#1144aa"),
                   position: CGPoint(x:bx-60,   y:by+72))
        // Y — Cycle weapon (above A)
        makeButton(name:"btnCycle",   label:"Y", color:.from(hex:"#884400"),
                   position: CGPoint(x:bx,      y:by+94))

        // Pause (top-right corner)
        makeButton(name:"btnPause", label:"⏸", color:UIColor.white.withAlphaComponent(0.15),
                   position: CGPoint(x:sceneSize.width/2-28, y:sceneSize.height/2-28), radius:18)
    }

    @discardableResult
    private func makeButton(name: String, label: String, color: UIColor,
                            position: CGPoint, radius: CGFloat = 26) -> SKShapeNode {
        let btn = SKShapeNode(circleOfRadius: radius)
        btn.fillColor = color.withAlphaComponent(0.40)
        btn.strokeColor = color.withAlphaComponent(0.70)
        btn.lineWidth = 2; btn.position = position; btn.zPosition = 5; btn.name = name
        addChild(btn)
        let lbl = SKLabelNode(text: label)
        lbl.fontName = "AvenirNext-Heavy"; lbl.fontSize = radius * 0.80
        lbl.fontColor = UIColor.white.withAlphaComponent(0.85)
        lbl.verticalAlignmentMode = .center; lbl.horizontalAlignmentMode = .center
        lbl.name = "lbl_\(name)"
        btn.addChild(lbl)
        return btn
    }

    // MARK: - Touch Handling (called from scene)
    func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        for touch in touches {
            let loc = touch.location(in: self)
            handleTouchBegan(touch: touch, location: loc)
        }
    }

    func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        for touch in touches {
            if touch == joystickTouchID {
                let loc = touch.location(in: self)
                updateJoystick(touchPos: loc)
            }
        }
    }

    func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        for touch in touches {
            if touch == joystickTouchID  { resetJoystick(); joystickTouchID = nil }
            if touch == attackTouchID    { attackTouchID = nil }
            if touch == interactTouchID  { interactTouchID = nil }
            if touch == runTouchID       { runTouchID = nil; onRun?(false) }
            if touch == cycleTouchID     { cycleTouchID = nil }
        }
    }

    func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesEnded(touches, with: event)
    }

    private func handleTouchBegan(touch: UITouch, location: CGPoint) {
        // Joystick zone: left half, lower area
        let isLeftZone = location.x < 0 && location.y < sceneSize.height/2 - 80

        if isLeftZone && joystickTouchID == nil {
            joystickTouchID = touch
            joystickCenter = location
            joystickBase.position = location
            joystickThumb.position = location
            joystickBase.run(SKAction.fadeAlpha(to:0.22, duration:0.1))
            return
        }

        // Check button nodes
        let tapped = nodes(at: location)
        for node in tapped {
            switch node.name {
            case "btnAttack", "lbl_btnAttack":
                attackTouchID = touch; onAttack?(); return
            case "btnRun", "lbl_btnRun":
                runTouchID = touch; onRun?(true); return
            case "btnInteract", "lbl_btnInteract":
                interactTouchID = touch; onInteract?(); return
            case "btnCycle", "lbl_btnCycle":
                cycleTouchID = touch; onCycleWeapon?(); return
            case "btnPause", "lbl_btnPause":
                onTogglePause?(); return
            default: break
            }
        }
    }

    private func updateJoystick(touchPos: CGPoint) {
        var delta = touchPos - joystickCenter
        let dist  = sqrt(delta.x*delta.x + delta.y*delta.y)
        if dist > joystickRadius {
            delta = delta * (joystickRadius / dist)
        }
        joystickThumb.position = joystickCenter + delta
        joystickDirection = dist > 8 ? (delta * (1.0/joystickRadius)) : .zero
    }

    private func resetJoystick() {
        joystickThumb.position = joystickCenter
        joystickDirection = .zero
    }
}

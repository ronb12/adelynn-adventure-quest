import SpriteKit
import UIKit

class VictoryScene: SKScene {

    override func didMove(to view: SKView) {
        backgroundColor = UIColor(red:0.02, green:0.01, blue:0.08, alpha:1)
        setupBackground()
        setupUI()
        SaveManager.shared.deleteSave()
    }

    private func setupBackground() {
        // Gold particle rain
        for _ in 0..<60 {
            let particle = SKShapeNode(circleOfRadius: CGFloat.random(in:1.5...4))
            particle.fillColor = UIColor(red:1.0, green:CGFloat.random(in:0.7...1.0), blue:0.0, alpha:0.8)
            particle.strokeColor = .clear
            particle.position = CGPoint(x:CGFloat.random(in:0...size.width), y:size.height + 20)
            addChild(particle)
            let duration = CGFloat.random(in:3.0...7.0)
            particle.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.move(to: CGPoint(x:CGFloat.random(in:0...size.width), y:-20), duration:duration),
                SKAction.move(to: CGPoint(x:CGFloat.random(in:0...size.width), y:size.height+20), duration:0)
            ])))
        }

        // Purple/gold glow
        let glow = SKShapeNode(circleOfRadius:size.width*0.45)
        glow.fillColor = UIColor(red:0.5,green:0.3,blue:1.0,alpha:0.12); glow.strokeColor = .clear
        glow.position = CGPoint(x:size.width/2, y:size.height*0.6)
        glow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to:1.15,duration:2.0), SKAction.scale(to:0.88,duration:2.0)
        ])))
        addChild(glow)
    }

    private func setupUI() {
        let store = GameStore.shared
        var y = size.height * 0.80
        var delay = 0.15

        func add(_ node: SKNode) {
            node.alpha = 0; addChild(node)
            node.run(SKAction.sequence([SKAction.wait(forDuration:delay), SKAction.fadeIn(withDuration:0.5)]))
            delay += 0.18
        }

        func lbl(_ text: String, font: String, fs: CGFloat, color: UIColor, at pos: CGPoint) -> SKLabelNode {
            let l = SKLabelNode(text:text)
            l.fontName=font; l.fontSize=fs; l.fontColor=color
            l.horizontalAlignmentMode = .center; l.verticalAlignmentMode = .center; l.position = pos
            return l
        }

        add(lbl("Victory!", font:"Georgia-Bold", fs:min(size.width*0.10,52), color:UIColor(red:1.0,green:0.85,blue:0.2,alpha:1), at:CGPoint(x:size.width/2,y:y)))
        y -= 44
        add(lbl("The Crown of Radiance is restored.", font:"Georgia-Italic", fs:min(size.width*0.038,18), color:UIColor.white.withAlphaComponent(0.8), at:CGPoint(x:size.width/2,y:y)))
        y -= 24
        add(lbl("Aldenmere is saved.", font:"Georgia-Italic", fs:min(size.width*0.034,16), color:UIColor(red:0.75,green:0.55,blue:1.0,alpha:0.9), at:CGPoint(x:size.width/2,y:y)))

        // Three shards
        y -= 55
        for (i,n) in ["Shard of Dawn","Shard of Dusk","Shard of Ember"].enumerated() {
            let xOff = CGFloat(i-1) * min(size.width*0.28,130)
            let shard = buildShardNode(name:n)
            shard.position = CGPoint(x:size.width/2+xOff, y:y)
            add(shard)
        }

        // Stats panel
        y -= 80
        let panelW = min(size.width*0.75,340)
        let panel = SKShapeNode(rectOf:CGSize(width:panelW,height:110), cornerRadius:14)
        panel.fillColor = UIColor.black.withAlphaComponent(0.55)
        panel.strokeColor = UIColor(red:1.0,green:0.8,blue:0.2,alpha:0.35); panel.lineWidth=1.5
        panel.position = CGPoint(x:size.width/2,y:y)
        panel.alpha = 0; addChild(panel)
        panel.run(SKAction.sequence([SKAction.wait(forDuration:delay), SKAction.fadeIn(withDuration:0.4)]))
        delay += 0.15

        let stats: [(String,String,UIColor)] = [
            ("Final Score", "\(store.score)",        UIColor(red:1.0,green:0.85,blue:0.3,alpha:1)),
            ("Time",        store.elapsedFormatted,  .white),
            ("Rupees",      "\(store.rupees)",        UIColor(red:0.4,green:0.9,blue:0.5,alpha:1)),
            ("Elites Slain","\(store.eliteKills)",   UIColor(red:1.0,green:0.5,blue:0.2,alpha:1)),
        ]
        for (i,(k,v,c)) in stats.enumerated() {
            let col = i % 2; let row = i / 2
            let x = CGFloat(col)*panelW*0.46 - panelW*0.23
            let sy = CGFloat(1-row)*30.0
            let kl = SKLabelNode(text:k+":"); kl.fontName="AvenirNext"; kl.fontSize=11
            kl.fontColor = UIColor.white.withAlphaComponent(0.6)
            kl.horizontalAlignmentMode = .center; kl.position = CGPoint(x:x,y:sy+12)
            panel.addChild(kl)
            let vl = SKLabelNode(text:v); vl.fontName="AvenirNext-Bold"; vl.fontSize=15
            vl.fontColor = c; vl.horizontalAlignmentMode = .center; vl.position = CGPoint(x:x,y:sy-4)
            panel.addChild(vl)
        }

        // Play Again
        y -= 90
        let btn = SKShapeNode(rectOf:CGSize(width:240,height:52), cornerRadius:12)
        btn.fillColor = UIColor(red:0.8,green:0.35,blue:0.0,alpha:1)
        btn.strokeColor = UIColor.white.withAlphaComponent(0.25); btn.lineWidth=1; btn.name="playAgain"
        btn.position = CGPoint(x:size.width/2,y:y)
        btn.alpha = 0; addChild(btn)
        btn.run(SKAction.sequence([SKAction.wait(forDuration:delay), SKAction.fadeIn(withDuration:0.4),
            SKAction.repeatForever(SKAction.sequence([SKAction.scale(to:1.04,duration:0.75), SKAction.scale(to:1.0,duration:0.75)]))]))
        let bl = SKLabelNode(text:"▶  Play Again"); bl.fontName="Georgia-Bold"; bl.fontSize=17; bl.fontColor = .white
        bl.verticalAlignmentMode = .center; bl.name="lbl_playAgain"; btn.addChild(bl)
    }

    private func buildShardNode(name: String) -> SKNode {
        let c = SKNode()
        let path = UIBezierPath()
        path.move(to:CGPoint(x:0,y:22)); path.addLine(to:CGPoint(x:14,y:6))
        path.addLine(to:CGPoint(x:0,y:-22)); path.addLine(to:CGPoint(x:-14,y:6)); path.close()
        let shard = SKShapeNode(path:path.cgPath)
        shard.fillColor = UIColor(red:0.5,green:0.8,blue:1.0,alpha:0.9)
        shard.strokeColor = .white; shard.lineWidth=1.5
        shard.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.rotate(byAngle:.pi*0.08,duration:1.0), SKAction.rotate(byAngle:-.pi*0.08,duration:1.0)
        ])))
        c.addChild(shard)
        let lbl = SKLabelNode(text:name); lbl.fontName="Georgia"; lbl.fontSize=9
        lbl.fontColor = UIColor(red:0.5,green:0.85,blue:1.0,alpha:0.85)
        lbl.position = CGPoint(x:0,y:-32); lbl.verticalAlignmentMode = .center; c.addChild(lbl)
        return c
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let tapped = nodes(at:touch.location(in:self))
        for n in tapped where n.name == "playAgain" || n.name == "lbl_playAgain" {
            GameStore.shared.resetGame()
            run(SKAction.sequence([
                SKAction.fadeOut(withDuration:0.4),
                SKAction.run { [weak self] in
                    guard let self, let v = view else { return }
                    let s = TitleScene(size:size); s.scaleMode = .aspectFill
                    v.presentScene(s, transition:SKTransition.fade(with:.black, duration:0.4))
                }
            ]))
            return
        }
    }
}

import { Player } from '@remotion/player'
import { MyComposition } from '../remotion/MyComposition'

export function RemotionPreview() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
          Remotion Preview
        </span>
      </div>
      <Player
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{ width: '100%', aspectRatio: '16 / 9' }}
        controls
      />
    </div>
  )
}

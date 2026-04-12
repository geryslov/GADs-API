import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export const MyComposition = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.1])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: '#60a5fa',
          fontSize: 80,
          fontWeight: 700,
        }}
      >
        Google Ads MCC
      </div>
      <div
        style={{
          opacity,
          color: '#94a3b8',
          fontSize: 28,
          marginTop: 16,
        }}
      >
        Frame {frame}
      </div>
    </AbsoluteFill>
  )
}

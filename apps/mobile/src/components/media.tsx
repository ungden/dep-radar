import * as React from "react"
import { useVideoPlayer, VideoView } from "expo-video"
import { FlatList, View, useWindowDimensions } from "react-native"
import { aspect, colors } from "@/theme"
import { Photo } from "@/ui/bits"
import { Txt } from "@/ui/text"

/** Full-bleed photos, swiped sideways, 4:5, with a quiet counter below. */
export function PhotoPager({ images, recyclingKey }: { images: string[]; recyclingKey?: string }) {
  const { width } = useWindowDimensions()
  const [page, setPage] = React.useState(0)
  if (!images.length) return <Photo ratio={aspect.photo} rounded={0} style={{ width }} />
  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}:${uri}`}
        renderItem={({ item, index }) => (
          <View accessible accessibilityLabel={`Ảnh ${index + 1} trên ${images.length}`}>
            <Photo uri={item} rounded={0} style={{ width }} recyclingKey={`${recyclingKey}:${index}`} />
          </View>
        )}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      />
      {images.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingTop: 10 }}>
          {images.map((_, i) => (
            <View key={i} style={{ width: i === page ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? colors.ink : colors.subtleStrong }} />
          ))}
          <Txt v="meta" color={colors.muted} style={{ marginLeft: 6 }} tabular>
            {page + 1}/{images.length}
          </Txt>
        </View>
      ) : null}
    </View>
  )
}

/** A clip of up to 60 seconds, 9:16, muted and looping until tapped for controls. */
export function Clip({ uri, maxHeight }: { uri: string; maxHeight: number }) {
  const { width } = useWindowDimensions()
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })
  const height = Math.min(maxHeight, width / aspect.video)
  return (
    <View style={{ alignItems: "center", backgroundColor: colors.ink }}>
      <VideoView player={player} style={{ width: height * aspect.video, height }} contentFit="cover" nativeControls allowsPictureInPicture={false} />
    </View>
  )
}

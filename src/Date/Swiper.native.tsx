import * as React from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  getHorizontalMonthOffset,
  getIndexFromVerticalOffset,
  getMonthHeight,
  getVerticalMonthsOffset,
  montHeaderHeight,
} from './Month'

import { SwiperProps, useYearChange } from './SwiperUtils'
import { beginOffset, estimatedMonthHeight, totalMonths } from './dateUtils'

const styles = StyleSheet.create({
  viewPager: {
    flex: 1,
  },
})
const visibleArray = (i: number) => [i - 2, i - 1, i, i + 1, i + 2]

function Swiper({
  scrollMode,
  renderItem,
  renderHeader,
  renderFooter,
  selectedYear,
  initialIndex,
}: SwiperProps) {
  const [visibleIndexes, setVisibleIndexes] = React.useState<number[]>(
    visibleArray(initialIndex)
  )
  const isHorizontal = scrollMode === 'horizontal'
  const { width, height } = useWindowDimensions()
  const idx = React.useRef<number>(initialIndex)
  const parentRef = React.useRef<ScrollView | null>(null)

  const scrollTo = React.useCallback(
    (index: number, animated: boolean) => {
      idx.current = index
      setVisibleIndexes(visibleArray(index))

      if (!parentRef.current) {
        return
      }
      const offset = isHorizontal
        ? getHorizontalMonthOffset(index, width)
        : getVerticalMonthsOffset(index) - montHeaderHeight

      if (isHorizontal) {
        parentRef.current.scrollTo({
          y: 0,
          x: offset,
          animated,
        })
      } else {
        parentRef.current.scrollTo({
          y: offset,
          x: 0,
          animated,
        })
      }
    },
    [parentRef, isHorizontal, width]
  )

  const onPrev = React.useCallback(() => {
    scrollTo(idx.current - 1, true)
  }, [scrollTo, idx])

  const onNext = React.useCallback(() => {
    scrollTo(idx.current + 1, true)
  }, [scrollTo, idx])

  const scrollToInitial = React.useCallback(() => {
    scrollTo(idx.current, false)
  }, [scrollTo])

  const onMomentumScrollEnd = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = e.nativeEvent.contentOffset
      const viewSize = e.nativeEvent.layoutMeasurement
      const newIndex = isHorizontal
        ? Math.floor(contentOffset.x / viewSize.width)
        : getIndexFromVerticalOffset(contentOffset.y - beginOffset)

      if (newIndex === 0) {
        return
      }

      if (idx.current !== newIndex) {
        idx.current = newIndex
        setVisibleIndexes(visibleArray(newIndex))
      }
    },
    [idx, isHorizontal]
  )

  const renderProps = {
    index: 0,
    onPrev,
    onNext,
  }

  useYearChange(
    (newIndex) => {
      if (newIndex) {
        scrollTo(newIndex, false)
      }
    },
    {
      selectedYear,
      currentIndexRef: idx,
    }
  )

  return (
    <>
      {renderHeader && renderHeader(renderProps)}
      <ScrollView
        ref={parentRef}
        horizontal={isHorizontal}
        pagingEnabled={isHorizontal}
        style={styles.viewPager}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onMomentumScrollEnd}
        onLayout={scrollToInitial}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={10}
      >
        <View
          style={{
            height: isHorizontal ? height : estimatedMonthHeight * totalMonths,
            width: isHorizontal ? width * totalMonths : width,
            position: 'relative',
          }}
        >
          {[0, 1, 2, 3, 4].map((vi) => (
            <View
              key={vi}
              style={{
                top: isHorizontal
                  ? 0
                  : getVerticalMonthsOffset(visibleIndexes[vi]),
                left: isHorizontal
                  ? getHorizontalMonthOffset(visibleIndexes[vi], width)
                  : 0,
                right: isHorizontal ? undefined : 0,
                bottom: isHorizontal ? 0 : undefined,
                position: 'absolute',
                width: isHorizontal ? width : undefined,
                height: isHorizontal
                  ? undefined
                  : getMonthHeight(scrollMode, visibleIndexes[vi]),
              }}
            >
              {renderItem({
                index: visibleIndexes[vi],
                onPrev: onPrev,
                onNext: onNext,
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {renderFooter && renderFooter(renderProps)}
    </>
  )
}

export default React.memo(Swiper)
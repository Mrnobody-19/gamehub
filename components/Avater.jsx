import { StyleSheet,} from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { Image } from 'expo-image'
import { hp } from '../helpers/common'
import { getUserImageSrc } from '../services/imageService'

const Avater =  ({
    uri,
    size=hp(4.5),
    rounded=theme.radius.md,
    style={}
}) => {
  return (
  <Image
        source={getUserImageSrc(uri)}
        transition={100}
        style={[styles.avater, {height: size, width: size, borderRadius: rounded}, style]}
  />
  )
}

export default Avater

const styles = StyleSheet.create({
    avater:{
        boarderCurve: 'continuous',
        borderColor: theme.colors.darklight,
        borderWidth: 1
    }
})
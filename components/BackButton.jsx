import { Pressable, StyleSheet,} from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import Icon from '../assets/icons'

const BackButton = ({size=26, router}) => {
  return (
    <Pressable onPress={()=> router.back()} style={styles.button}>
      <Icon name="arrowLeft" strokeWidth={3.5} size={size} color={theme.colors.text}/>
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button:{
        alignItems:'flex-start',
        padding: 5,
        borderRadius: theme.radius.sm,
        
    }
})
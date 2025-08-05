import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect,useState } from 'react'
import { fetchNotifications } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const {user} = useAuth();

  useEffect(() => {
       getNotifications();
  }, []);

const getNotifications = async () => {
  let res = await fetchNotifications(user.id);
  console.log("Notifications: ", res);
}

  return (
    <View>
      <Text>Notifications</Text>
    </View>
  )
}

export default Notifications

const styles = StyleSheet.create({})
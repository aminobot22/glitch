# -*- coding: utf-8 -*-
__copyright__ = "Copyright (c) 2014-2017 Agora.io, Inc."

import sys
import os
import time
from random import randint

sys.path.insert(0,
                os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.DynamicKey5 import *
def gen2(name):

  appID = "d544b053e3e94dd2a8f51c6668522372"
  app_certificate = "bcfd3566615f4043a9fad8b05dfcc21b"
  channel_name = name
  token_expire = 3600
  uid = 0
  role = 1
  unixts = int(time.time());
  uid = 0
  randomint = -2147483647
  expiredts = 0
  token = generateMediaChannelKey(appID, app_certificate, channel_name, unixts, randomint, uid, expiredts)
  print(token)
  return format(token)

def gen(name):

  appID = "d544b053e3e94dd2a8f51c6668522372"
  app_certificate = "bcfd3566615f4043a9fad8b05dfcc21b"
  channel_name = name
  token_expire = 3600
  uid = 0
  role = 1
  token = build_token_with_uid(appID,
                               app_certificate,
                               channel_name,
                               uid,
                               role,
                               token_expire,
                               privilege_expire=0)
  print(token)
  return format(token)

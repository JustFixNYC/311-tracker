import json
import pandas as pd
import gspread
import requests
import psycopg
import sqlalchemy


def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

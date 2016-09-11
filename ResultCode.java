package cn.wanjl.jquery.crud;

import com.google.gson.Gson;

public final class ResultCode {

	private int ret;
	private String ret_msg;

	public ResultCode() {
		super();
	}

	public ResultCode(int ret, String ret_msg) {
		super();
		this.ret = ret;
		this.ret_msg = ret_msg;
	}

	public int getRet() {
		return ret;
	}

	public void setRet(int ret) {
		this.ret = ret;
	}

	public String getRet_msg() {
		return ret_msg;
	}

	public void setRet_msg(String ret_msg) {
		this.ret_msg = ret_msg;
	}

	public static String genResultCode(int ret, String ret_msg) {
		Gson gson = new Gson();

		ResultCode rc = new ResultCode(ret, ret_msg);

		return gson.toJson(rc);

	}
}

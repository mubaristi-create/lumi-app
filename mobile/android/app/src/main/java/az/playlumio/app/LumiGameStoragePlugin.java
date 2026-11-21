package az.playlumio.app;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.AtomicFile;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Internal app files for recoverable game commands. No auth keys are accepted. */
@CapacitorPlugin(name="LumiGameStorage")
public class LumiGameStoragePlugin extends Plugin {
 private File file(PluginCall call)throws Exception{String key=call.getString("key");if(key==null||!key.matches("(game-outbox|sudoku-action|tiles-outbox|tiles-resume|tiles-progress|tiles-prefs):[a-zA-Z0-9-]{1,64}"))throw new Exception("Invalid recovery key");StringBuilder name=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)))name.append(String.format("%02x",b&255));File dir=new File(getContext().getFilesDir(),"game-recovery-v1");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Recovery directory");return new File(dir,name.toString()+".json");}
 @PluginMethod public synchronized void getItem(PluginCall call){try{AtomicFile f=new AtomicFile(file(call));JSObject r=new JSObject();if(!f.getBaseFile().exists())r.put("value",org.json.JSONObject.NULL);else{byte[] bytes=f.readFully();if(bytes.length>8388608)throw new IOException("Recovery file too large");r.put("value",new String(bytes,StandardCharsets.UTF_8));}call.resolve(r);}catch(Exception e){call.reject("Game recovery storage unavailable","GAME_STORAGE");}}
 @PluginMethod public synchronized void setItem(PluginCall call){AtomicFile f=null;FileOutputStream out=null;try{String value=call.getString("value");if(value==null||value.length()>4194304)throw new IOException("Recovery value");f=new AtomicFile(file(call));out=f.startWrite();out.write(value.getBytes(StandardCharsets.UTF_8));f.finishWrite(out);call.resolve();}catch(Exception e){if(f!=null&&out!=null)f.failWrite(out);call.reject("Game recovery storage unavailable","GAME_STORAGE");}}
 @PluginMethod public synchronized void removeItem(PluginCall call){try{new AtomicFile(file(call)).delete();call.resolve();}catch(Exception e){call.reject("Game recovery storage unavailable","GAME_STORAGE");}}
}
